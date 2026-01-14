import "@stdlib/gas-payments"
import "@stdlib/common"

struct Storage {
    seqno: uint32
    pubkey: uint256
}

fun Storage.load() {
    return Storage.fromCell(contract.getData())
}

fun Storage.save(self) {
    contract.setData(self.toCell())
}

get fun getSeqno(): uint32 {
    val storage = lazy Storage.load();
    return storage.seqno;
}

get fun getPublicKey(): uint256 {
    val storage = lazy Storage.load();
    return storage.pubkey;
}

struct (0x3a752f01) ExternalMessage {
    seqno: uint32
    valid_until: uint32
    to: address
    amount: coins
    signature: bits512
}

fun onInternalMessage(in: InMessage) {}

fun onExternalMessage(inMsg: slice) {
    var storage = lazy Storage.load();
    val msg = ExternalMessage.fromSlice(inMsg);
    var signature = msg.signature as slice;

    assert(msg.valid_until >= blockchain.now()) throw 36;
    assert(msg.seqno == storage.seqno) throw 33;

    val payload = beginCell()
        .storeUint(0x3a752f01, 32)
        .storeUint(msg.seqno, 32)
        .storeUint(msg.valid_until, 32)
        .storeAddress(msg.to)
        .storeCoins(msg.amount)
        .endCell();

    val isValid = isSignatureValid(payload.hash(), signature, storage.pubkey);

    assert(isValid) throw 35;

    acceptExternalMessage();

    storage.seqno += 1;
    storage.save();

    val outMsg =createMessage({
        bounce: BounceMode.NoBounce,
        dest: msg.to,
        value: msg.amount
    });

    outMsg.send(SEND_MODE_REGULAR)
}