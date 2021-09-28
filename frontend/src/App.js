import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import ReactLoading from "react-loading";
import "./styles/App.css";
import myEpicNft from "./utils/MyEpicNFT.json";
import twitterLogo from "./assets/twitter-logo.svg";

// Constants
const TWITTER_HANDLE = "_buildspace";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "https://testnets.opensea.io/assets/";
const OPENSEA_COLLECTION_LINK =
  "https://testnets.opensea.io/collection/cryptosquaresnft-v3";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0x2A33aa46579a789edf1483837bE775C487D8A3cF";

const App = () => {
  /*
   * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalNFTsMinted, setTotalNFTsMinted] = useState();
  const NETWORK_PARAMS = {
    chainId: "0x4", // A 0x-prefixed hexadecimal chainId
    chainName: "Rinkeby",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
    },
    rpcUrls: ["https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
    blockExplorerUrls: ["https://rinkeby.etherscan.io/"],
  };

  const checkIfWalletIsConnected = async () => {
    /*
     * First make sure we have access to window.ethereum
     */
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Ensure network is correct
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_PARAMS.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [NETWORK_PARAMS],
          });
        } catch (addError) {}
      }
    }

    /*
     * Check if we're authorized to access the user's wallet
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    /*
     * User can have multiple authorized accounts, we grab the first one if its there!
     */
    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      // Setup Event listener if user is already connected
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * Implement your connectWallet method here
   */
  const connectWallet = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
       * Fancy method to request access to account.
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      /*
       * Boom! This should print out public address once we authorize Metamask.
       */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: ${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = useCallback(async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.");
        setLoading(true);
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
        );
        setLoading(false);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const getTotalNFTsMinted = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );

        console.log("Checking how many NFTs have been minted");
        let txn = await connectedContract.getTotalNFTsMinted.call();

        console.log("Checking...please wait.");
        console.log(txn);
        setTotalNFTsMinted(parseInt(txn._hex, 16));
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    getTotalNFTsMinted();
  }, []);

  const renderNotConnectedContainer = useCallback(
    () => (
      <button
        onClick={connectWallet}
        className="cta-button connect-wallet-button"
      >
        Connect to Wallet
      </button>
    ),
    [connectWallet]
  );

  const renderViewCollectionOnOpensea = () => (
    <button
      onClick={(e) => {
        e.preventDefault();
        window.open(OPENSEA_COLLECTION_LINK, "_blank");
      }}
      type="button"
      className="cta-button connect-wallet-button"
      style={{ marginTop: "30px" }}
    >
      View Collection On Opensea
    </button>
  );

  /*
   * We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
   */
  const renderMintUI = useCallback(
    () => (
      <button
        onClick={askContractToMintNft}
        className="cta-button connect-wallet-button"
      >
        Mint NFT
      </button>
    ),
    [askContractToMintNft]
  );

  const renderSpinnerUI = () => {
    return (
      <div className="spinner">
        <ReactLoading
          type={"spin"}
          color={"white"}
          height={"15%"}
          width={"15%"}
        />
      </div>
    );
  };

  /*
   * Added a conditional render! We don't want to show Connect to Wallet if we're already conencted :).
   */
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">CryptoSquares NFT Collection</p>
          {renderViewCollectionOnOpensea()}
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {totalNFTsMinted === TOTAL_MINT_COUNT ? (
            <p className="sub-text">All NFT's have been minted.</p>
          ) : (
            <p className="sub-text">
              {totalNFTsMinted}/{TOTAL_MINT_COUNT} NFT's have been minted so
              far.
            </p>
          )}
          {currentAccount === ""
            ? renderNotConnectedContainer()
            : totalNFTsMinted < TOTAL_MINT_COUNT
            ? renderMintUI()
            : false}
          <br />
          {loading && renderSpinnerUI()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
