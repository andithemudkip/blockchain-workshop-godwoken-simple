/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { getLayer2ckETHBalance } from '../lib/contracts/ERC20Helper';

// import { SimpleStorageWrapper } from '../lib/contracts/SimpleStorageWrapper';
import { NFTWrapper } from '../lib/contracts/ERC721PresetMinterPauserAutoIdWrapper';
import { CONFIG } from '../config';

import { SketchPicker } from 'react-color';
import { CopyToClipboard } from 'react-copy-to-clipboard';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

function Color (props: any) {
    return <div style = {{
        backgroundColor: props.color,
        width: "100px",
        height: "100px",
        display: "inline-block",
        margin: "10px",
        border: "5px solid white"
    }}></div>
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<NFTWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [l2ckETHBalance, setL2ckETHBalance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [depositAddress, setDepositAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    const [ownColors, setOwnColors] = useState <string []> ();

    const [newStoredColorValue, setNewStoredColorValue] = useState<string | undefined>();

    //update the colors everytime the contract updates
    useEffect(() => {
        if (contract) showOwnColors ();
    }, [contract]);

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
            
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect (() => {
        if (accounts?.[0]) {
            (async () => {
                const addressTranslator = new AddressTranslator();
                const l2Address = await addressTranslator.getLayer2DepositAddress(web3, accounts?.[0]);
                setDepositAddress (l2Address.addressString);
            })();
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new NFTWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to mint new colors.',
                { type: 'success' }
            );

        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new NFTWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
    }

    async function mintNewColor () {
        try {
            setTransactionInProgress(true);
            await contract.mint(account, newStoredColorValue);
            toast(
                'Successfully minted new color.',
                { type: 'success' }
            );
            await showOwnColors ();
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function showOwnColors () {
        toast(
            'Loading your NFTs. Please wait up to 20 seconds.',
            { type: 'info' }
        );
        try {
            let colors : string[] = [];
            colors = await contract.getOwnColors(account);
            console.log (colors);
            setOwnColors (colors);
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        }
    }

    // async function getDepositAddress (ethAddress: string) {
    //     const addressTranslator = new AddressTranslator();
    //     const depositAddress = await addressTranslator.getLayer2DepositAddress(web3, ethAddress);
    //     return depositAddress;
    // }

    // async function getLayer2ckETHBalance (ethAddress: string) {
    //     const addressTranslator = new AddressTranslator();
    //     const l2Address = await addressTranslator.getLayer2DepositAddress(web3, ethAddress);
    //     const balance = await web3.eth.getBalance(l2Address.addressString);
    //     return balance;
    // }


    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    useEffect (() => {
        if (web3 && polyjuiceAddress && accounts?.[0]) {
            (async () => {
                const _l2ckETHBalance = BigInt (await getLayer2ckETHBalance (web3, polyjuiceAddress, accounts?.[0]));
                console.log (_l2ckETHBalance);
                setL2ckETHBalance (_l2ckETHBalance);
            })();
        }
    }, [web3, polyjuiceAddress, accounts?.[0]]);

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            <span style = {{ wordBreak: 'break-word' }} >Your Layer 2 deposit address: <b>{depositAddress ? (
                <CopyToClipboard text = {depositAddress} onCopy = {() => {
                    toast.info ('Copied to clipboard.', { type: 'info' });
                }}>
                    <button className = "copy-to-clipboard" >Copy to clipboard</button>
                </CopyToClipboard>
            ) : <LoadingIndicator />}</b></span>
            <br/>
            <br/>
            You may deposit ETH to the above address using the <a href = "https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000">Force Bridge</a> for it to show up as ckETH on Layer 2
            <br/>
            <br/>
            ckETH Balance: <b>{l2ckETHBalance !== undefined ? ((Number (l2ckETHBalance) / (10 ** 18))).toString () : <LoadingIndicator />} ckETH</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <p>
                The button below will deploy a simple NFT smart contract where each NFT can be a different color.

                You may redeploy the contract or you can use the already deployed one at address: 0xfC2e2A04500Afa5348A2F359C9f73e5C2D55D1eE
            </p>
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <br />
            <br />
            <SketchPicker color = {newStoredColorValue} onChangeComplete = { (color: any) => setNewStoredColorValue (color.hex) } />

            <button onClick = {mintNewColor} disabled = {!contract}>
                Mint new color
            </button>

            <button onClick = {showOwnColors} disabled = {!contract}>
                get colors
            </button>

            { ownColors ? <div>Your NFTs</div> : null }

            { ownColors?.length ? ownColors.map (col => <Color key = {col} color = {col}/>) : null }

            <br />
            <br />
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
