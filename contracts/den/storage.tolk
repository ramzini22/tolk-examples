struct ContractStorage {
    seller: address;
    bayer: address;
    arbitrator: address;
    deal: Cell<DealStorage>
}

struct GetContractStorage {
    seller: address;
    bayer: address;
    arbitrator: address;
}

struct DealStorage {
    dealHash: uint256
    status: Status
    amount: coins
}

enum Status: uint32  {
    CREATED
}

fun ContractStorage.load() {
    return ContractStorage.fromCell(contract.getData())
}

fun ContractStorage.save(self) {
    contract.setData(self.toCell())
}