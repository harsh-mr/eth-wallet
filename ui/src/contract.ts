import { ethers } from "ethers";
import address from './artifacts/address.json';
import OTP from './artifacts/OTP.json';
import OTPFactory from './artifacts/OTPFactory.json';
import { generateCalldata } from './circuit_js/generate_calldata';

import Create2Factory from './artifacts/Create2Factory.json'
import { AbiCoder, hexConcat, hexlify, hexValue, hexZeroPad } from 'ethers/lib/utils';


import { EntryPoint, EntryPoint__factory } from '@account-abstraction/contracts'
import { HttpRpcClient } from '@account-abstraction/sdk/dist/src/HttpRpcClient'
import { ERC4337EthersProvider } from '@account-abstraction/sdk'
import { MyWalletApi } from './MyWalletApi'
// import { deployments } from 'hardhat';
import { MyWalletDeployer__factory } from './types/factories'
import { OTP__factory } from './types/factories/OTP__factory'
import { MyPaymasterApi } from './MyPaymasterApi'
import { MyWallet__factory } from "./dist/types";

let factory: ethers.Contract;
let otp: ethers.Contract;

const ENTRYPOINT_ADDR = '0x2167fA17BA3c80Adee05D98F0B55b666Be6829d6'
const MY_WALLET_DEPLOYER = address.MyWalletDeployer
const ABI = [{"inputs":[{"internalType":"contract IEntryPoint","name":"anEntryPoint","type":"address"},{"internalType":"address","name":"anOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldEntryPoint","type":"address"},{"indexed":true,"internalType":"address","name":"newEntryPoint","type":"address"}],"name":"EntryPointChanged","type":"event"},{"inputs":[],"name":"addDeposit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"entryPoint","outputs":[{"internalType":"contract IEntryPoint","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"dest","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"func","type":"bytes"}],"name":"exec","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"dest","type":"address[]"},{"internalType":"bytes[]","name":"func","type":"bytes[]"}],"name":"execBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"dest","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"func","type":"bytes"}],"name":"execFromEntryPoint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getDeposit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastUsedTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"root","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_root","type":"uint256"},{"internalType":"address","name":"_verifier","type":"address"}],"name":"setMerkleRootAndVerifier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[2]","name":"a","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"b","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"c","type":"uint256[2]"},{"internalType":"uint256[2]","name":"input","type":"uint256[2]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"testTransfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"dest","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newEntryPoint","type":"address"}],"name":"updateEntryPoint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"initCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"callGasLimit","type":"uint256"},{"internalType":"uint256","name":"verificationGasLimit","type":"uint256"},{"internalType":"uint256","name":"preVerificationGas","type":"uint256"},{"internalType":"uint256","name":"maxFeePerGas","type":"uint256"},{"internalType":"uint256","name":"maxPriorityFeePerGas","type":"uint256"},{"internalType":"bytes","name":"paymasterAndData","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"}],"internalType":"struct UserOperation","name":"userOp","type":"tuple"},{"internalType":"bytes32","name":"requestId","type":"bytes32"},{"internalType":"address","name":"aggregator","type":"address"},{"internalType":"uint256","name":"missingWalletFunds","type":"uint256"}],"name":"validateUserOp","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"verifierAddr","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address payable","name":"withdrawAddress","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawDepositTo","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[2]","name":"a","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"b","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"c","type":"uint256[2]"},{"internalType":"uint256[2]","name":"d","type":"uint256[2]"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"address","name":"dest","type":"address"}],"name":"zkProof","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

const providerConfig = {
    entryPointAddress: ENTRYPOINT_ADDR,
    bundlerUrl: 'https://eip4337-bundler-goerli.protonapp.io/rpc',
  }

export async function connectContract(addr: string) {
    // const {deploy} = deployments;

    

    const { ethereum } = window;
		let root1 = (localStorage.getItem("MerkleRoot"));
        let root = BigInt(root1);
        console.log(root,typeof(root))

        // console.log(root);
        // let root  = BigInt(2969605364619292656752330573544450919744795437254059361867215089577272985436);

    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = provider.getSigner();
    let network = await provider.getNetwork();

    console.log('signer: ', await signer.getAddress());

    const entryPoint = EntryPoint__factory.connect(providerConfig.entryPointAddress, provider)

    const MyWalletDeployer = MyWalletDeployer__factory.connect(MY_WALLET_DEPLOYER, signer)
    const factoryAddress = MyWalletDeployer.address


    const ownerAddress = await signer.getAddress();

    const walletAddress = await MyWalletDeployer.getDeploymentAddress(ENTRYPOINT_ADDR, ownerAddress, root, 0)

    console.log('--- end deploying MyWalletDeployer contract ---')

    const myPaymasterApi = new MyPaymasterApi();

    const smartWalletAPI = new MyWalletApi({
        provider: provider,
        entryPointAddress: entryPoint.address,
        walletAddress: walletAddress,
        owner: signer,
        factoryAddress: factoryAddress,
        paymasterAPI: myPaymasterApi
    })

    console.log('--- Erc4337EthersProvider initialisation ---')

    const httpRpcClient = new HttpRpcClient(providerConfig.bundlerUrl, providerConfig.entryPointAddress, network.chainId)

    const aaProvier = await new ERC4337EthersProvider(network.chainId,
        providerConfig,
        signer,
        provider,
        httpRpcClient,
        entryPoint,
        smartWalletAPI
      ).init()

    const aaSigner = aaProvier.getSigner()

    // const scw = new ethers.ContractFactory(MyWallet__factory.abi, MyWallet__factory.bytecode);

    console.log('SCW address: ', await aaSigner.getAddress())

    // const scw = new ethers.Contract(await aaSigner.getAddress(),MyWallet__factory.abi,  aaSigner)

    otp = OTP__factory.connect(addr, signer)

    // otp = new ethers.Contract(addr, OTP.abi, signer);

    otp = otp.connect(aaSigner)

    console.log("Connect to OTP Contract:", OTP);
}

export async function setRootAndVerifier(smartWalletAPI: MyWalletApi, aaProvier: ERC4337EthersProvider){

    const aaSigner = aaProvier.getSigner()

    const scw = new ethers.ContractFactory(ABI, MyWallet__factory.bytecode);

    let root = localStorage.getItem("MerkleRoot");
    
    console.log(root,typeof(root))

    root = root!==null? root: '123'
    //  root = root!==null? root: BigInt(123)


    console.log(`root here: ${root}`)
    console.log(address.Verifier)
    // console.log(`data: ${scw.interface.encodeFunctionData('setMerkleRootAndVerifier', [root, address.Verifier])}`)

    let data1 =  scw.interface.encodeFunctionData('setMerkleRootAndVerifier', [root, address.Verifier])
    console.log(`data1: ${data1}`)
    console.log("a",await aaSigner.getAddress())
    const op = await smartWalletAPI.createSignedUserOp({
        target: await aaSigner.getAddress(),
        data: scw.interface.encodeFunctionData("setMerkleRootAndVerifier", [root, address.Verifier])
    })
    console.log("op: ")
    console.log(op)
    let tx = await aaProvier.httpRpcClient.sendUserOpToBundler(op)
        
    console.log(`here`)
    // console.log(tx)
}

export async function getAaParams()
{
		let root = localStorage.getItem("MerkleRoot");
    const { ethereum } = window;

    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = provider.getSigner();
    let network = await provider.getNetwork();

    console.log('signer: ', await signer.getAddress());

    const entryPoint = EntryPoint__factory.connect(providerConfig.entryPointAddress, provider)

    const MyWalletDeployer = MyWalletDeployer__factory.connect(MY_WALLET_DEPLOYER, signer)
    const factoryAddress = MyWalletDeployer.address


    const ownerAddress = await signer.getAddress();

    const walletAddress = await MyWalletDeployer.getDeploymentAddress(ENTRYPOINT_ADDR, ownerAddress, root)

    console.log('--- end deploying MyWalletDeployer contract ---')

    const myPaymasterApi = new MyPaymasterApi();

    const smartWalletAPI = new MyWalletApi({
        provider: provider,
        entryPointAddress: entryPoint.address,
        walletAddress: walletAddress,
        owner: signer,
        factoryAddress: factoryAddress,
        paymasterAPI: myPaymasterApi
    })
    console.log('--- Erc4337EthersProvider initialisation ---')

    const httpRpcClient = new HttpRpcClient(providerConfig.bundlerUrl, providerConfig.entryPointAddress, network.chainId)

    const aaProvier = await new ERC4337EthersProvider(network.chainId,
        providerConfig,
        signer,
        provider,
        httpRpcClient,
        entryPoint,
        smartWalletAPI
      ).init()

    const aaSigner = aaProvier.getSigner()

    return {smartWalletAPI, httpRpcClient, aaProvier}
}
export async function connectFactory() {
    const { ethereum } = window;

    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = provider.getSigner();
    console.log('signer: ', await signer.getAddress());

    

    factory = new ethers.Contract(address['OTPFactory'], OTPFactory.abi, signer);

    console.log("Connect to OTPFactory Contract:", OTPFactory);
}

export async function deployOTP(root: BigInt) {
    await connectFactory();

    let Tx = await factory.createOTP(address['Verifier'], root);
    let tx = await Tx.wait();
    console.log(tx)
    let deployedAddress = tx.events[0].args.newAddress;

    localStorage.setItem("OTPaddress", deployedAddress);

    return deployedAddress;
}

export async function naiveProof(input: Object, amount: string, recepient: string) {
    let root = localStorage.getItem("MerkleRoot");
    console.log(root,typeof(root))
    let {smartWalletAPI, httpRpcClient, aaProvier} = await getAaParams();
    
    const aaSigner = aaProvier.getSigner()


    const scw = new ethers.Contract('0xA094a2Dc2B363f934DE3858a56dF86Cd117a49ef',ABI, aaSigner)
    console.log('abi',MyWallet__factory.abi);
    
    console.log(`amount: ${amount} recepient: ${recepient}`)
//ZK Proof being generated
    const calldata: any = await generateCalldata(input);
    console.log("calldata")
    console.log(calldata)
    let tx;

    if (calldata) {
        // console.log(otp.address)
        console.log(`recepient: ${recepient} amount: ${amount}`)

        const tx = await scw.zkProof(calldata[0], calldata[1], calldata[2], calldata[3], ethers.utils.parseEther(amount), recepient)
        const rc2 = await tx.wait()
        console.log(rc2)

            } else {
        throw new Error("Witness generation failed.");
    }
    return tx;
}

export async function blockTimestampProof(input: Object) {

    if (localStorage.getItem('OTPaddress')) {
        console.log(localStorage.getItem('OTPaddress'));
        await connectContract(localStorage.getItem('OTPaddress')!);
    } else {
        throw new Error("No OTP contract address found. Deploy first.");
    }

    let calldata = await generateCalldata(input);
    let tx;

    if (calldata) {
        tx = await otp.blockApproval(calldata[0], calldata[1], calldata[2], calldata[3])
            .catch((error: any) => {
                console.log(error);
                let errorMsg;
                if (error.reason) {
                    errorMsg = error.reason;
                } else if (error.data.message) {
                    errorMsg = error.data.message;
                } else {
                    errorMsg = "Unknown error."
                }
                throw errorMsg;
            });
    } else {
        throw new Error("Witness generation failed.");
    }
    return tx;
}