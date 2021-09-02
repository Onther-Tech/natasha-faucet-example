const fs = require('fs')

const {
  Contract,
  Wallet,
  providers,
  utils,
} = require('ethers')

;(async () => {
  require("dotenv").config();

  const l1FeeTokenAbi = JSON.parse(fs.readFileSync("./abi/mockFeeToken.json", "utf-8")).abi
  const l2FeeTokenAbi = JSON.parse(fs.readFileSync("./abi/OVM_FeeToken.json", "utf-8")).abi
  const l1BridgeAbi = JSON.parse(fs.readFileSync("./abi/OVM_L1StandardBridge.json", "utf-8")).abi

  const privateKey = process.env.PRIVATE_KEY
  const l1Endpoint = process.env.RINKEBY_NODE_WEB3_URL
  const l2Endpoint = process.env.L2_NODE_WEB3_URL
  const l1FeeTokenAddress = "0xA54bc6a3eAe22f7254E8C4494e2929Af94140441"
  const l2FeeTokenAddress = "0x4200000000000000000000000000000000000100"

  const l1BridgeAddress = process.env.L1_BRIDGE_ADDRESS

  const l1RpcProvider = new providers.JsonRpcProvider(l1Endpoint)
  const l2RpcProvider = new providers.JsonRpcProvider(l2Endpoint)

  const l1Wallet = new Wallet(privateKey, l1RpcProvider)
  const l2Wallet = new Wallet(privateKey, l2RpcProvider)

  const l1FeeToken = new Contract(
    l1FeeTokenAddress,
    l1FeeTokenAbi,
    l1Wallet
  )

  const l2FeeToken = new Contract(
    l2FeeTokenAddress,
    l2FeeTokenAbi,
    l2Wallet
  )

  const l1Bridge = new Contract(
    l1BridgeAddress,
    l1BridgeAbi,
    l1Wallet
  )

  const balance0 = await l1FeeToken.balanceOf(l1Wallet.address)
  console.log(`(L1) token balance: ${balance0}`)

  // Faucet on L1
  const tx1 = await l1FeeToken.mint(l1Wallet.address, utils.parseEther('20000'))
  await tx1.wait()

  const balance1 = await l1FeeToken.balanceOf(l1Wallet.address)
  console.log(`(L1) token balance: ${balance1}`)

  // Faucet on L2
  const balance3 = await l2FeeToken.balanceOf(l2Wallet.address)
  console.log(`(L2) token balance: ${balance3}`)
  const amount = utils.parseEther('10000')
  const tx2 = await l1FeeToken.approve(l1BridgeAddress, amount)
  await tx2.wait()

  const tx3 = await l1Bridge.depositERC20(
    l1FeeToken.address,
    l2FeeToken.address,
    amount,
    1_300_000, // DEFAULT_TEST_GAS_L2
    '0xFFFF',
    {
      gasLimit: 330_000 // DEFAULT_TEST_GAS_L1,
    }
  )
  await tx3.wait()

  // TODO: wait for processing on L2

  const balance4 = await l2FeeToken.balanceOf(l2Wallet.address)
  console.log(`(L2) token balance: ${balance4}`)
})()
