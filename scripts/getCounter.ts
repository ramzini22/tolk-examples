import { Address } from '@ton/core';
import { FirstContract } from '../wrappers/FirstContract';
import { NetworkProvider } from '@ton/blueprint';

const contractAddress = Address.parse('kQB9P3PL73I2geJnUlX7tajbFlA37KW7M1Y4Hup2IXZ2vqBb');

export async function run(provider: NetworkProvider) {
    const firstContract = provider.open(new FirstContract(contractAddress));
    const counter = await firstContract.getCounter();
    console.log('Counter: ', counter);
}
