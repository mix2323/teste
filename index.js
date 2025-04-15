
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const NFT_CONTRACT_ADDRESS = "0x4c71fb79cdc312ffc504960fbb0248d0fb9255fb";
const TOKEN_CONTRACT_ADDRESS = "0xa1d482f27b4c10aab960c2927965e1beceead456";
const NFT_ABI = ["function mint() public"];
const TOKEN_ABI = [
  "function claim() public",
  "function balanceOf(address) view returns (uint256)",
  "function name() view returns (string)"
];

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenName, setTokenName] = useState("");

  useEffect(() => {
    if (walletConnected && address) {
      fetchTokenBalance();
    }
  }, [walletConnected, address]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletConnected(true);
        setAddress(accounts[0]);
        await switchToFujiNetwork();
      } catch (err) {
        console.error("Wallet connection failed", err);
        toast.error("Failed to connect wallet");
      }
    } else {
      toast.error("MetaMask not found. Please install it.");
    }
  };

  const switchToFujiNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xa869',
          chainName: 'Avalanche Fuji Testnet',
          nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
          rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
          blockExplorerUrls: ['https://testnet.snowtrace.io']
        }]
      });
    } catch (err) {
      console.error("Error switching network", err);
      toast.error("Error switching to Fuji network");
    }
  };

  const mintNFT = async () => {
    if (!walletConnected) return toast.error("Connect your wallet first");
    const isOnFuji = await checkNetwork();
    if (!isOnFuji) return toast.error("Please switch to Fuji Testnet network");

    try {
      setIsLoading(true);
      const provider = new ethers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const tx = await contract.mint();
      await tx.wait();
      toast.success("NFT minted with success!");
    } catch (err) {
      console.error("Mint failed", err);
      toast.error("Minting failed");
    } finally {
      setIsLoading(false);
    }
  };

  const claimTokens = async () => {
    if (!walletConnected) return toast.error("Connect your wallet first");
    const isOnFuji = await checkNetwork();
    if (!isOnFuji) return toast.error("Please switch to Fuji Testnet network");

    try {
      setIsLoading(true);
      const provider = new ethers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, signer);
      const tx = await contract.claim();
      await tx.wait();
      toast.success("Tokens claimed!");
      fetchTokenBalance();
    } catch (err) {
      console.error("Claim failed", err);
      toast.error("Claim failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokenBalance = async () => {
    try {
      const provider = new ethers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, provider);
      const balance = await contract.balanceOf(address);
      const name = await contract.name();
      setTokenName(name);
      setTokenBalance(ethers.formatUnits(balance, 18));
    } catch (err) {
      console.error("Error fetching token balance", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6">
      <Toaster />
      <header className="text-center py-16">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-5xl font-bold mb-4">
          AvalPlay
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, delay: 0.3 }} className="text-xl mb-8">
          A modular Web3 gaming platform on Avalanche
        </motion.p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Button onClick={connectWallet} className="bg-white text-black hover:bg-gray-300">
            {walletConnected ? `Connected: ${address.slice(0, 6)}...` : "Connect Wallet"}
          </Button>
          <Button variant="outline" onClick={mintNFT} disabled={isLoading}>
            {isLoading ? "Minting..." : "Mint NFT"}
          </Button>
          <Button variant="outline" onClick={claimTokens} disabled={isLoading}>
            {isLoading ? "Claiming..." : "Claim Tokens"}
          </Button>
        </div>
        {walletConnected && tokenBalance !== null && (
          <p className="mt-4 text-sm text-green-300">
            Token Balance: {tokenBalance} {tokenName || "$AVAL"}
          </p>
        )}
      </header>
    </div>
  );
}
