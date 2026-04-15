import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tolk',
    entrypoint: 'contracts/payment/payment-contract.tolk',
    withSrcLineComments: true,
    withStackComments: true,
};
