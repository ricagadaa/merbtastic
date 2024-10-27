import { Box, Button, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { useSnackPresistStore, useStorePresistStore, useUserPresistStore } from 'lib/store';
import { LANGUAGES } from 'packages/constants';
import { useEffect, useState } from 'react';
import axios from 'utils/http/axios';
import { Http } from 'utils/http/http';

const Checkout = () => {
  const { getStoreId } = useStorePresistStore((state) => state);
  const { getUserId } = useUserPresistStore((state) => state);
  const { setSnackSeverity, setSnackOpen, setSnackMessage } = useSnackPresistStore((state) => state);

  const [customHtmlTitle, setCustomHtmlTitle] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [showDetectLanguage, setShowDetectLanguage] = useState<boolean>();
  const [showPayInWalletButton, setShowPayInWalletButton] = useState<boolean>();
  const [showPaymentConfetti, setShowPaymentConfetti] = useState<boolean>();
  const [showPaymentList, setShowPaymentList] = useState<boolean>();
  const [showPaymentMethod, setShowPaymentMethod] = useState<boolean>();
  const [showPublicReceiptPage, setShowPublicReceiptPage] = useState<boolean>();
  const [showQrcodeReceipt, setShowQrcodeReceipt] = useState<boolean>();
  const [showRedirectUrl, setShowRedirectUrl] = useState<boolean>();
  const [showSound, setShowSound] = useState<boolean>();
  const [supportUrl, setSupportUrl] = useState<string>('');
  const [showHeader, setShowHeader] = useState<boolean>();

  const init = async () => {
    try {
      const find_store_resp: any = await axios.get(Http.find_store_checkout_setting_by_id, {
        params: {
          store_id: getStoreId(),
          user_id: getUserId(),
        },
      });

      if (find_store_resp.result && find_store_resp.data.length === 1) {
        setShowPaymentConfetti(find_store_resp.data[0].show_payment_confetti === 1 ? true : false);
        setShowSound(find_store_resp.data[0].show_sound === 1 ? true : false);
        setShowPayInWalletButton(find_store_resp.data[0].show_pay_in_wallet_button === 1 ? true : false);
        setCustomHtmlTitle(find_store_resp.data[0].custom_html_title);
        setLanguage(find_store_resp.data[0].language);
        setShowDetectLanguage(find_store_resp.data[0].show_detect_language === 1 ? true : false);
        setSupportUrl(find_store_resp.data[0].support_url);
        setShowPaymentMethod(find_store_resp.data[0].show_payment_method === 1 ? true : false);
        setShowRedirectUrl(find_store_resp.data[0].show_redirect_url === 1 ? true : false);
        setShowPublicReceiptPage(find_store_resp.data[0].show_public_receipt_page === 1 ? true : false);
        setShowPaymentList(find_store_resp.data[0].show_payment_list === 1 ? true : false);
        setShowQrcodeReceipt(find_store_resp.data[0].show_qrcode_receipt === 1 ? true : false);
        setShowHeader(find_store_resp.data[0].show_header === 1 ? true : false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const onClickSave = async () => {
    try {
      const save_store_resp: any = await axios.put(Http.save_store_checkout_setting_by_id, {
        user_id: getUserId(),
        store_id: getStoreId(),
        show_payment_confetti: showPaymentConfetti ? 1 : 2,
        show_sound: showSound ? 1 : 2,
        show_pay_in_wallet_button: showPayInWalletButton ? 1 : 2,
        show_detect_language: showDetectLanguage ? 1 : 2,
        language: language,
        custom_html_title: customHtmlTitle,
        support_url: supportUrl,
        show_payment_method: showPaymentMethod ? 1 : 2,
        show_redirect_url: showRedirectUrl ? 1 : 2,
        show_public_receipt_page: showPublicReceiptPage ? 1 : 2,
        show_payment_list: showPaymentList ? 1 : 2,
        show_qrcode_receipt: showQrcodeReceipt ? 1 : 2,
        show_header: showHeader ? 1 : 2,
      });

      if (save_store_resp.result) {
        setSnackSeverity('success');
        setSnackMessage('Save successful!');
        setSnackOpen(true);

        await init();
      } else {
        setSnackSeverity('error');
        setSnackMessage('The update failed, please try again later.');
        setSnackOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Box>
        <Typography variant="h6">Invoice Settings</Typography>
        <Box mt={4}>
          <Typography>Set the money selection page</Typography>
          {/* <Box mt={2}>
            <FormControl sx={{ minWidth: 300 }}>
              <Select
                size={'small'}
                inputProps={{ 'aria-label': 'Without label' }}
                defaultValue={1}
                //   value={age}

                //   onChange={handleChange}
              >
                <MenuItem value={1}>BTC(On-Chain)</MenuItem>
                <MenuItem value={2}>AAA</MenuItem>
                <MenuItem value={3}>BBB</MenuItem>
              </Select>
            </FormControl>
          </Box> */}
        </Box>

        {/* <Box mt={5}>
          <Typography>Enable payment methods only when amount is …</Typography>
          <Stack direction={'row'} alignItems={'center'} mt={2}>
            <Typography>BTC (On-Chain)</Typography>
            <Box ml={10}>
              <Select
                size={'small'}
                inputProps={{ 'aria-label': 'Without label' }}
                defaultValue={1}
                //   value={age}
                //   onChange={handleChange}
              >
                <MenuItem value={1}>Greater than</MenuItem>
                <MenuItem value={2}>Less than</MenuItem>
              </Select>
            </Box>
            <Box ml={2}>
              <TextField hiddenLabel defaultValue="" size="small" placeholder="6.15 USD" />
            </Box>
          </Stack>
        </Box> */}
      </Box>

      <Box mt={6}>
        <Typography variant="h6">Checkout</Typography>
        <Stack direction={'row'} mt={4} alignItems={'center'}>
          <Switch
            checked={showPaymentConfetti}
            onChange={() => {
              setShowPaymentConfetti(!showPaymentConfetti);
            }}
          />
          <Typography ml={1}>Celebrate payment with confetti</Typography>
        </Stack>
        <Stack direction={'row'} alignItems={'center'}>
          <Switch
            checked={showSound}
            onChange={() => {
              setShowSound(!showSound);
            }}
          />
          <Typography ml={1}>Enable sounds on checkout page</Typography>
        </Stack>
        <Stack direction={'row'} alignItems={'center'}>
          <Switch
            checked={showHeader}
            onChange={() => {
              setShowHeader(!showHeader);
            }}
          />
          <Typography ml={1}>Show the store header</Typography>
        </Stack>
        <Stack direction={'row'} alignItems={'center'}>
          <Switch
            checked={showPayInWalletButton}
            onChange={() => {
              setShowPayInWalletButton(!showPayInWalletButton);
            }}
          />
          <Typography ml={1}>Show "Pay in wallet" button</Typography>
        </Stack>
        <Stack direction={'row'} alignItems={'center'} mt={1}>
          <Switch
            checked={showDetectLanguage}
            onChange={() => {
              setShowDetectLanguage(!showDetectLanguage);
            }}
          />
          <Box ml={1}>
            <Typography>Auto-detect language on checkout</Typography>
            <Typography mt={1}>Detects the language of the customer's browser.</Typography>
          </Box>
        </Stack>

        <Box mt={5}>
          <Typography>Default language on checkout</Typography>
          <Box mt={1}>
            <Select
              size={'small'}
              inputProps={{ 'aria-label': 'Without label' }}
              style={{ width: 200 }}
              value={language}
              onChange={(e: any) => {
                setLanguage(e.target.value);
              }}
            >
              {LANGUAGES &&
                LANGUAGES.length > 0 &&
                LANGUAGES.map((item, index) => (
                  <MenuItem value={item.name} key={index}>
                    {item.name}
                  </MenuItem>
                ))}
            </Select>
          </Box>

          <Box mt={3}>
            <Typography>Custom HTML title to display on Checkout page</Typography>
            <Box mt={1}>
              <TextField
                fullWidth
                hiddenLabel
                value={customHtmlTitle}
                onChange={(e: any) => {
                  setCustomHtmlTitle(e.target.value);
                }}
                size="small"
              />
            </Box>
          </Box>

          <Box mt={3}>
            <Typography>Support URL</Typography>
            <Box mt={1}>
              <TextField
                fullWidth
                hiddenLabel
                value={supportUrl}
                onChange={(e: any) => {
                  setSupportUrl(e.target.value);
                }}
                size="small"
              />
            </Box>
            <Typography mt={1} fontSize={14}>
              For support requests related to partially paid invoices. A "Contact Us" button with this link will be
              shown on the invoice expired page. Can contain the placeholders [OrderId] and [InvoiceId]. Can be any
              valid URI, such as a website, email, and Nostr.
            </Typography>
          </Box>

          <Box mt={4}>
            <Stack direction={'row'} alignItems={'center'}>
              <Switch
                checked={showPaymentMethod}
                onChange={() => {
                  setShowPaymentMethod(!showPaymentMethod);
                }}
              />
              <Typography ml={1}>Only enable the payment method after user explicitly chooses it</Typography>
            </Stack>
            <Stack direction={'row'} alignItems={'center'}>
              <Switch
                checked={showRedirectUrl}
                onChange={() => {
                  setShowRedirectUrl(!showRedirectUrl);
                }}
              />
              <Typography ml={1}>Redirect invoice to redirect url automatically after paid</Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box mt={5}>
        <Typography variant="h6">Public receipt</Typography>
        <Box mt={5}>
          <Stack direction={'row'} alignItems={'center'}>
            <Switch
              checked={showPublicReceiptPage}
              onChange={() => {
                setShowPublicReceiptPage(!showPublicReceiptPage);
              }}
            />
            <Typography ml={1}>Enable public receipt page for settled invoices</Typography>
          </Stack>
          <Stack direction={'row'} alignItems={'center'}>
            <Switch
              checked={showPaymentList}
              onChange={() => {
                setShowPaymentList(!showPaymentList);
              }}
            />
            <Typography ml={1}>Show the payment list in the public receipt page</Typography>
          </Stack>
          <Stack direction={'row'} alignItems={'center'}>
            <Switch
              checked={showQrcodeReceipt}
              onChange={() => {
                setShowQrcodeReceipt(!showQrcodeReceipt);
              }}
            />
            <Typography ml={1}>Show the QR code of the receipt in the public receipt page</Typography>
          </Stack>
        </Box>

        <Box mt={4}>
          <Button variant={'contained'} size="large" onClick={onClickSave}>
            Save
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Checkout;
