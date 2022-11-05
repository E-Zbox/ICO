require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });
// env variables
const {
    env: { PRIVATE_KEY, QUICKNODE_HTTP_PROVIDER },
} = process;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.17",
    networks: {
        goerli: {
            accounts: [PRIVATE_KEY],
            url: QUICKNODE_HTTP_PROVIDER,
        },
    },
};
