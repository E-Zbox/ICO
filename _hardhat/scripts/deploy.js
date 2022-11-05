const { ethers } = require("hardhat");
const { join } = require("path");

require("dotenv").config({ path: join(__dirname, ".env") });

// env variables
const {
    env: { CRYPTODEVS_NFT_CONTRACT_ADDRESS },
} = process;
const main = async () => {
    const contractFactory = await ethers.getContractFactory("CryptoDevToken");
    const deployedContract = await contractFactory.deploy(
        CRYPTODEVS_NFT_CONTRACT_ADDRESS
    );

    await deployedContract.deployed();

    console.log(`Crypto Devs Token ${deployedContract.address}`);
};

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.log(err);
        process.exit(1);
    });
