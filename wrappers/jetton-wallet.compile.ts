import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk',
    entrypoint: 'contracts/jetton/jetton-wallet-contract.tolk',
    withSrcLineComments: true,
    withStackComments: true,
};
