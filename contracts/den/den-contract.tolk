import "storage"

get fun getContractStorage(): GetContractStorage{
    val storage = lazy ContractStorage.load();

    return {
        seller: storage.seller,
        bayer: storage.bayer,
        arbitrator: storage.arbitrator
    };
}

get fun getDealStorage(): DealStorage{
    val storage = lazy ContractStorage.load();
    return storage.deal.load();
}

fun onInternalMessage(in: InMessage) {
    var storage = lazy ContractStorage.load();
}