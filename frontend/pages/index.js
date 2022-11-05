// constants
import {
    abiCryptoDevsNFT,
    abiCryptoDevsToken,
    contractAddressCryptoDevsNFT,
    contractAddressCryptoDevsToken,
} from "../constants";
// ethers
import { BigNumber, Contract, providers, utils } from "ethers";
// next
import Head from "next/head";
// react
import React, { useEffect, useRef, useState } from "react";
// styles
import styles from "../styles/Home.module.css";
// web3
import Web3Modal from "web3modal";

export default function Home() {
    // create a BigNumber `0`
    const zero = BigNumber.from(0);
    // walletConnected keeps track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false);
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(false);
    // tokenToBeClaimed keeps track of the number of tokens that can be claimed
    // based on the Crypto Dev NFT's held by the user for which they haven't claimed the tokens
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
    // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
        useState(zero);
    // amount of the tokens that the user wants to mint
    const [tokenAmount, setTokenAmount] = useState(zero);
    // tokensMinted is the total number of tokens that have been minted till now out of 10000 (max total supply)
    const [tokensMinted, setTokensMinted] = useState(zero);
    // address will be the address of connected user
    const [address, setAddress] = useState("");
    // isOwner gets the owner of the contract through the signed address
    const [isOwner, setIsOwner] = useState(false);
    // create a reference to the web3 modal (used for connecting to Metamask) which persists as long as the page is open
    const web3ModalRef = useRef();

    /**
     * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
     */
    const getTokensToBeClaimed = async () => {
        let provider = await getProviderOrSigner();
        // create an instance of NFT contract
        let nftContract = new Contract(
            contractAddressCryptoDevsNFT,
            abiCryptoDevsNFT,
            provider
        );
        // create an instance of Token Contract
        let tokenContract = new Contract(
            contractAddressCryptoDevsToken,
            abiCryptoDevsToken,
            provider
        );

        // loading is true
        const balance = await nftContract.balanceOf(address);
        // balance is a Big number and thus we would compare it with Big number `zero`
        if (balance === zero) {
            setTokensToBeClaimed(zero);
        } else {
            // amount keeps track of the number of unclaimed tokens
            var amount = 0;
            // for all the NFT's, check if the tokens have already been claimed
            // only increase the amount if the tokens have not been claimed
            // for a/an NFT (for a given tokenId)
            for (let index = 0; index < balance; index++) {
                let tokenId = await nftContract.tokenOfOwnerByIndex(
                    address,
                    index
                );
                let claimed = await tokenContract.tokenIdsClaimed(tokenId);
                if (!claimed) {
                    amount++;
                }
            }
            // tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
            // to a big number and then set its value
            setTokensToBeClaimed(BigNumber.from(amount));
        }
    };

    /**
     * getBalanceOfCryptoDevTokens: checks the balance of
     * Crypto Dev Token's held by an address
     */
    const getBalanceOfCryptoDevTokens = async () => {
        let provider = await getProviderOrSigner();
        let contract = new Contract(
            contractAddressCryptoDevsToken,
            abiCryptoDevsToken,
            provider
        );
        // loading is true
        let balance = await contract.balanceOf(address);
        // loading is false
        // balance is already a big number, so we don't need to convert it before setting it
        setBalanceOfCryptoDevTokens(balance);
    };

    /**
     * mintCryptoDevToken: mints `amount` number of tokens to a given address
     */
    const mintCryptoDevToken = async (amount) => {
        let signer = await getProviderOrSigner(true);
        let contract = new Contract(
            contractAddressCryptoDevsToken,
            abiCryptoDevsToken,
            signer
        );
        // each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
        let value = utils.parseEther(`${0.01 * amount}`);
        let tx = await contract.mint(amount, { value });
        // loading is true
        setLoading(true);
        await tx.wait();
        // loading is false
        setLoading(false);
        window.alert("Successfully minted Crypto Dev Tokens");
        await getBalanceOfCryptoDevTokens();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
    };

    /**
     * claimCryptoDevTokens: helps the user claim Crypto Dev Tokens
     */
    const claimCryptoDevTokens = async () => {
        let signer = await getProviderOrSigner(true);
        let contract = new Contract(
            contractAddressCryptoDevsToken,
            abiCryptoDevsToken,
            signer
        );
        let tx = await contract.claim();

        // loading is true
        setLoading(true);
        await tx.wait();
        // loading is false
        setLoading(false);
        window.alert("Successfully claimed Crypto DevTokens");
        await getBalanceOfCryptoDevTokens();
        await getTotalTokensMinted();
        await getTokensToBeClaimed();
    };

    /**
     * getTotalTokensMinted: Retrieves how many tokens have been minted
     * till now out of the total supply
     */
    const getTotalTokensMinted = async () => {
        let provider = await getProviderOrSigner();
        let contract = new Contract(
            contractAddressCryptoDevsToken,
            abiCryptoDevsToken,
            provider
        );
        // loading is true
        let _tokensMinted = await contract.totalSupply();
        console.log(_tokensMinted);
        // loading is false
        setTokensMinted(_tokensMinted);
    };

    /**
     * getOwner: gets the contract owner by connected address
     */
    const getOwner = async () => {
        let provider = await getProviderOrSigner();
        let contract = new Contract(
            contractAddressCryptoDevsToken,
            abiCryptoDevsToken,
            provider
        );
        // loading is true
        let _owner = await contract.owner();
        // loading is false
        if (_owner === address) {
            setIsOwner(true);
        }
    };

    /**
     * withdrawCoins: withdraws ether and tokens by calling
     * the withdraw function in the contract
     */
    const withdrawCoins = async () => {
        if (isOwner) {
            let signer = await getProviderOrSigner(true);
            let contract = new Contract(
                contractAddressCryptoDevsToken,
                abiCryptoDevsToken,
                signer
            );
            let tx = await contract.withdraw();

            // loading is true
            setLoading(true);
            await tx.wait();
            // loading is false
            setLoading(false);
            await getOwner();
        } else {
            window.alert(
                "You are not the owner. Only contract owner can withdraw coins "
            );
        }
    };

    /**
     * getProviderOrSigner
     * @params needSigner - if true returns signer else provider
     */
    const getProviderOrSigner = async (needSigner = false) => {
        let connection = await web3ModalRef.current.connect();
        let web3Provider = new providers.Web3Provider(connection);

        let { chainId } = await web3Provider.getNetwork();
        if (chainId !== 5) {
            window.alert(
                "Change the network to goerli to interact with the application"
            );
            throw new Error(
                "Change the network to goerli to interact with the application"
            );
        }

        if (needSigner) {
            let signer = web3Provider.getSigner();
            return signer;
        }

        return web3Provider;
    };

    /**
     * connectWallet: this connects with the web3Provider wallet (Metamask)
     * updates the walletConnected state
     */
    const connectWallet = async () => {
        let signer = await getProviderOrSigner(true);
        let _address = await signer.getAddress();
        setAddress(_address);
        setWalletConnected(true);
    };

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                disableInjectedProvider: false,
                providerOptions: {},
                network: "goerli",
            });
            connectWallet().catch((err) => console.log(err));
        }
    }, [walletConnected]);

    useEffect(() => {
        if (walletConnected) {
            getTotalTokensMinted().catch((err) => console.log(err));
            getBalanceOfCryptoDevTokens().catch((err) => console.log(err));
            getTokensToBeClaimed().catch((err) => console.log(err));
            withdrawCoins().catch((err) => console.log(err));
        }
    }, [walletConnected]);

    /**
     * renderButton: Returns a button based on the state of the dapp
     */
    const renderButton = () => {
        // if we are currently waiting for something, return a loading button
        if (loading) {
            return (
                <div>
                    <button className={styles.button}>Loading...</button>
                </div>
            );
        }
        // if owner is connected, withdrawCoins() can be called
        if (walletConnected && isOwner) {
            return (
                <div>
                    <button className={styles.button1} onClick={withdrawCoins}>
                        Withdraw Coins
                    </button>
                </div>
            );
        }
        // if tokens to be claimed are greater than 0, Return a claim button
        if (tokensToBeClaimed > 0) {
            return (
                <div>
                    <div className={styles.description}>
                        {tokensToBeClaimed * 10} Tokens can be claimed!
                    </div>
                    <button
                        className={styles.button}
                        onClick={claimCryptoDevTokens}
                    >
                        Claim Tokens
                    </button>
                </div>
            );
        }
        // if user doesn't have any tokens to claim, show the mint button
        return (
            <div style={{ display: "flex-col" }}>
                <div>
                    <input
                        type="number"
                        placeholder="Amount of Tokens"
                        // BigNumber.from converts the `e.targt.value` to a BigNumber
                        onChange={({ target: { value } }) =>
                            setTokenAmount(BigNumber.from(value))
                        }
                        className={styles.input}
                    />
                </div>
                <button
                    className={styles.button}
                    disabled={!(tokenAmount > 0)}
                    onClick={() => mintCryptoDevToken(tokenAmount)}
                >
                    Mint Tokens
                </button>
            </div>
        );
    };

    return (
        <div>
            <Head>
                <title>Crypto Devs</title>
                <meta name="description" content="ICO-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>
                        Welcome to Crypto Devs ICO!
                    </h1>
                    <div className={styles.description}>
                        You can claim or mint Crypto Dev tokens here
                    </div>
                    {walletConnected ? (
                        <div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                You have minted{" "}
                                {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                                Crypto Dev Tokens
                            </div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                Overall {utils.formatEther(tokensMinted)} /
                                10000 have been minted!!!
                            </div>
                            {renderButton()}
                            <div className={styles.description}>
                                Connected address:{" "}
                                <span className={styles.subTitle}>
                                    {address}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <button
                            className={styles.button}
                            onClick={connectWallet}
                        >
                            Connect your wallet
                        </button>
                    )}
                </div>
                <div>
                    <img src="./0.svg" alt=".svg" className={styles.image} />
                </div>
            </div>
            <footer className={styles.footer}>
                Made with &#10084; by Crypto Devs
            </footer>
        </div>
    );
}
