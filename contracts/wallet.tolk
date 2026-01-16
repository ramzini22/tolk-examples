import "@stdlib/gas-payments"
import "@stdlib/common"

struct Storage {
    wallet_id: uint32
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

struct (0x3a752f01) Send {
    to: address
    amount: coins
}

type Body = Send

struct ExternalMessage {
    signature: bits512
    subwallet_id: uint32
    seqno: uint32
    valid_until: uint32
    body: Cell<Body>
}

fun onInternalMessage(in: InMessage) {}

fun onExternalMessage(inMsg: slice) {
    val msg = ExternalMessage.fromSlice(inMsg);
    var signature = inMsg.getFirstBits(512) as slice;
    val payload = inMsg.skipBits(512);

    assert(msg.valid_until >= blockchain.now()) throw 36;

    var storage = lazy Storage.load();
    assert(msg.seqno == storage.seqno) throw 33;
    assert(msg.subwallet_id == storage.wallet_id) throw 34;

    val isValid = isSignatureValid(payload.hash(), signature, storage.pubkey);
    assert(isValid) throw 35;

    acceptExternalMessage();

    val body = msg.body.load();

    match (body) {
        Send => {
            val outMsg =createMessage({
                bounce: BounceMode.NoBounce,
                dest: body.to,
                value: body.amount
            });

            outMsg.send(SEND_MODE_REGULAR);
            storage.seqno += 1;
            storage.save();
        }
    }
}