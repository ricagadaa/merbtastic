import axios from 'axios';
import { BLOCKCHAINNAMES, CHAINIDS, CHAINS } from 'packages/constants/blockchain';
import {
  AssetBalance,
  ChainAccountType,
  CreateTonTransaction,
  EthereumTransactionDetail,
  SendTransaction,
  TransactionDetail,
  TRANSACTIONSTATUS,
} from '../types';
import { ethers } from 'ethers';
import { FindDecimalsByChainIdsAndContractAddress } from 'utils/web3';
import { GetBlockchainTxUrl } from 'utils/chain/ton';
import { BLOCKSCAN } from '../block_scan';
import TonWeb from 'tonweb';
import { keyPairFromSecretKey } from 'ton-crypto';
import { HDKey } from 'ethereum-cryptography/hdkey';

export class TON {
  static chain = CHAINS.TON;

  static axiosInstance = axios.create({
    timeout: 50000,
  });

  static getChainIds(isMainnet: boolean): CHAINIDS {
    return isMainnet ? CHAINIDS.TON : CHAINIDS.TON_TESTNET;
  }

  static getTonClient(isMainnet: boolean): TonWeb {
    const url = isMainnet ? 'https://toncenter.com/api/v2/jsonRPC' : 'https://testnet.toncenter.com/api/v2/jsonRPC';
    return new TonWeb(new TonWeb.HttpProvider(url, { apiKey: process.env.TON_API_KEY }));
  }

  static async createAccountBySeed(isMainnet: boolean, seed: Buffer): Promise<ChainAccountType> {
    const path = `m/44'/607'/0'/0/0`;

    try {
      const hdkey = HDKey.fromMasterSeed(Uint8Array.from(seed)).derive(path);

      const privateKey = TonWeb.utils.bytesToHex(hdkey.privateKey as Uint8Array);

      const tonweb = this.getTonClient(isMainnet);

      const keypair = keyPairFromSecretKey(Buffer.from(privateKey));

      const wallet = tonweb.wallet.create({
        publicKey: keypair.publicKey,
      });

      const walletAddress = (await wallet.getAddress()).toString(true, true, false, !isMainnet);

      return {
        chain: this.chain,
        address: walletAddress,
        privateKey: privateKey,
        note: 'TON',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of ton');
    }
  }

  static async createAccountByPrivateKey(isMainnet: boolean, privateKey: string): Promise<ChainAccountType> {
    try {
      const tonweb = this.getTonClient(isMainnet);

      const keypair = keyPairFromSecretKey(Buffer.from(privateKey));

      const wallet = tonweb.wallet.create({
        publicKey: keypair.publicKey,
      });

      const walletAddress = (await wallet.getAddress()).toString(true, true, false, !isMainnet);

      return {
        chain: this.chain,
        address: walletAddress,
        privateKey: privateKey,
        note: 'TON',
        isMainnet: isMainnet,
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not create a wallet of ton');
    }
  }

  static checkAddress(isMainnet: boolean, address: string): boolean {
    const tonweb = this.getTonClient(isMainnet);
    return tonweb.Address.isValid(address);
  }

  static checkQRCodeText(text: string): boolean {
    const regex = /ton:(\w+)(\?Fvalue=(\d+)&decimal=(\d+))?(&contractAddress=(\w+))?/;
    try {
      const matchText = text.match(regex);
      if (matchText) {
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  static parseQRCodeText(text: string): any {
    const regex = /ton:(\w+)(\?value=(\d+)&decimal=(\d+))?(&contractAddress=(\w+))?/;

    try {
      const matchText = text.match(regex);
      if (matchText) {
        const address = matchText[1];
        const value = matchText[3] || 0;
        const decimal = matchText[4] || 18;
        const amount = ethers.formatUnits(value, decimal);
        const contractAddress = matchText[6] || undefined;

        return {
          address,
          amount,
          decimal,
          contractAddress,
        };
      } else {
        return;
      }
    } catch (e) {
      console.error(e);
      return;
    }
  }

  static async generateQRCodeText(
    isMainnet: boolean,
    address: string,
    contractAddress?: string,
    amount?: string,
  ): Promise<string> {
    let qrcodeText = `ton:${address}`;
    const decimal = contractAddress ? await this.getTokenDecimals(isMainnet, contractAddress) : 9;

    amount = amount || '0';
    const value = ethers.parseUnits(amount, decimal).toString();

    qrcodeText += `?value=${value}&decimal=${decimal}`;

    if (contractAddress) {
      qrcodeText += `&contractAddress=${contractAddress}`;
    }

    return qrcodeText;
  }

  static async getAssetBalance(isMainnet: boolean, address: string): Promise<AssetBalance> {
    try {
      let items = {} as AssetBalance;
      items.TON = await this.getTONBalance(isMainnet, address);

      const coins = BLOCKCHAINNAMES.find((item) => item.chainId === this.getChainIds(isMainnet))?.coins;
      if (coins && coins.length > 0) {
        const tokens = coins.filter((item) => !item.isMainCoin);

        const promises = tokens.map(async (token) => {
          if (token.contractAddress && token.contractAddress !== '') {
            const balance = await this.getTokenBalance(isMainnet, address, token.contractAddress);
            items[token.symbol] = balance;
          }
        });

        await Promise.all(promises);
      }
      return items;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the asset balance of ton');
    }
  }

  static async getTONBalance(isMainnet: boolean, address: string): Promise<string> {
    try {
      const tonweb = this.getTonClient(isMainnet);
      const balance = await tonweb.provider.getBalance(address);
      const balanceInTON = TonWeb.utils.fromNano(balance);
      return balanceInTON;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the ton balance of ton');
    }
  }

  static async getTokenBalance(isMainnet: boolean, address: string, contractAddress: string): Promise<string> {
    try {
      // const tonweb = this.getTonClient(isMainnet);
      // const jettonWallet = new TonWeb.token.jetton.JettonWallet(tonweb.provider, {
      //   address: contractAddress,
      // });
      // const result = await jettonWallet.provider.getBalance(address);
      // const tokenDecimals = await this.getTokenDecimals(isMainnet, contractAddress);
      // return ethers.formatUnits(result, tokenDecimals);
      return '0';
    } catch (e) {
      console.error(e);
      throw new Error('can not get the token balance of ton');
    }
  }

  static async getTokenDecimals(isMainnet: boolean, contractAddress: string): Promise<number> {
    const decimals = FindDecimalsByChainIdsAndContractAddress(this.getChainIds(isMainnet), contractAddress);
    if (decimals && decimals > 0) {
      return decimals;
    }

    try {
      // const tonweb = this.getTonClient(isMainnet);

      return 0;
    } catch (e) {
      console.error(e);
      throw new Error('can not get the decimals of ton');
    }
  }

  static async getTransactionDetail(isMainnet: boolean, hash: string): Promise<TransactionDetail> {
    try {
      const tonweb = this.getTonClient(isMainnet);
      const explorerUrl = GetBlockchainTxUrl(isMainnet, hash);

      return {
        blockNumber: 0,
        blockTimestamp: 0,
        hash: hash,
        from: '',
        to: '',
        value: '',
        status: TRANSACTIONSTATUS.SUCCESS,
        fee: '',
        url: explorerUrl,
        asset: '',
      };
    } catch (e) {
      console.error(e);
      throw new Error('can not get the transaction of ton');
    }
  }

  static async getTransactions(
    isMainnet: boolean,
    address: string,
    symbol?: string,
  ): Promise<EthereumTransactionDetail[]> {
    try {
      symbol = symbol ? symbol : '';

      const url = `${BLOCKSCAN.baseUrl}/node/ton/getTransactions?chain_id=${this.getChainIds(
        isMainnet,
      )}&address=${address}&asset=${symbol}`;
      const response = await this.axiosInstance.get(url);
      if (response.data.code === 10200 && response.data.data) {
        const txs = response.data.data;

        return txs;
      } else {
        return [];
      }
    } catch (e) {
      console.error(e);
      return [];
      // throw new Error('can not get the transactions of ton');
    }
  }

  static async createTransaction(isMainnet: boolean, request: CreateTonTransaction): Promise<any> {
    if (request.contractAddress) {
      return await this.createTokenTransaction(isMainnet, request);
    } else {
      return await this.createTONTransaction(isMainnet, request);
    }
  }

  static async createTokenTransaction(isMainnet: boolean, request: CreateTonTransaction): Promise<any> {
    return '';
  }

  static async createTONTransaction(isMainnet: boolean, request: CreateTonTransaction): Promise<any> {
    return '';
  }

  static async sendTransaction(isMainnet: boolean, request: SendTransaction): Promise<string> {
    if (!request.privateKey || request.privateKey === '') {
      throw new Error('can not get the private key of ton');
    }

    try {
      const tonweb = this.getTonClient(isMainnet);
      const wallet = tonweb.wallet.create({
        address: request.from,
      });

      const seqno = (await wallet.methods.seqno().call()) || 0;
      const transfer = wallet.methods.transfer({
        secretKey: new Uint8Array(Buffer.from(request.privateKey)),
        toAddress: request.to,
        amount: TonWeb.utils.toNano(request.value),
        seqno: seqno,
        payload: request.memo,
        expireAt: Math.floor(Date.now() / 1000) + 60,
      });

      // const deploy = wallet.deploy(Buffer.from(request.privateKey)); // deploy method
      // /*  */
      // const deployFee = await deploy.estimateFee(); // get estimate fee of deploy
      // console.log(deployFee);

      // const deploySended = await deploy.send(); // deploy wallet contract to blockchain
      // console.log(deploySended);

      // const deployQuery = await deploy.getQuery(); // get deploy query Cell
      // console.log(deployQuery);

      const transferFee = await transfer.estimateFee(); // get estimate fee of transfer
      console.log(transferFee);

      const transferSended = await transfer.send(); // send transfer query to blockchain
      console.log(transferSended);

      const transferQuery = await transfer.getQuery(); // get transfer query Cell
      console.log(transferQuery);

      // const keypair = keyPairFromSecretKey(Buffer.from(request.privateKey));

      // const wallet = tonweb.wallet.create({
      //   publicKey: keypair.publicKey,
      // });

      // await wallet.createInitExternalMessage(keypair.publicKey);
      // await wallet.createTransferMessage(keypair.secretKey, request.from, TonWeb.utils.toNano(request.value), seqno);

      // const deploy = wallet.deploy(keypair.secretKey); // deploy method

      // const deployFee = await deploy.estimateFee(); // get estimate fee of deploy

      // const deploySended = await deploy.send(); // deploy wallet contract to blockchain

      // const deployQuery = await deploy.getQuery(); // get deploy query Cell

      // const transfer = wallet.methods.transfer({
      //   secretKey: new Uint8Array(keypair.secretKey),
      //   toAddress: request.to,
      //   amount: TonWeb.utils.toNano(request.value),
      //   seqno,
      //   payload: 'send transaction',
      //   sendMode: 3,
      // });

      // const transferSended = await transfer.send();

      // console.log('transferSended', transferSended);
      // if (transferSended) {
      //   return transferSended;
      // }

      throw new Error('can not send the transaction of ton');
    } catch (e) {
      console.error(e);
      throw new Error('can not send the transaction of ton');
    }
  }

  static async estimateGasFee(isMainnet: boolean, request: SendTransaction): Promise<any> {
    if (!request.privateKey || request.privateKey === '') {
      throw new Error('can not get the private key of ton');
    }

    try {
      const tonweb = this.getTonClient(isMainnet);

      const keypair = keyPairFromSecretKey(Buffer.from(request.privateKey));

      const wallet = tonweb.wallet.create({
        publicKey: keypair.publicKey,
      });

      const seqno = (await wallet.methods.seqno().call()) || 0;

      const fee = await wallet.methods
        .transfer({
          secretKey: new Uint8Array(keypair.secretKey),
          toAddress: request.to,
          amount: TonWeb.utils.toNano(request.value),
          seqno,
          payload: 'estimate gas fee',
        })
        .estimateFee();

      return TonWeb.utils.fromNano(fee.source_fees.gas_fee.toString());
    } catch (e) {
      console.error(e);
      throw new Error('can not estimate gas fee of ton');
    }
  }
}
