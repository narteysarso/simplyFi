//SPDX-License-Identifier: MIT

pragma solidity 0.8.20;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract SimplyFySplit is Ownable {
    using Counters for Counters.Counter;

    event BillCreated(
        uint256 indexed index,
        uint8 status,
        address indexed creator,
        uint256 amount
    );

    event DebtorPaid(
        uint256 index,
        address indexed recipient,
        address indexed debtor,
        address indexed payer,
        uint256 amountPaid
    );

    event BillCancelled(
        uint256 indexed index,
        address indexed creator,
        address indexed recipient
    );

    event RecipientPaid(uint256 indexed index, address indexed recipient);

    // Uniswap router instance
    ISwapRouter public constant swapRouter =
        ISwapRouter(0x5615CDAb10dc425a742d643d949a7F474C01abc4);

    //pause contract during emergency
    bool _pauseContract = false;

    address _swapContractAddress;

    address _lpTokenContractAddress;

    // mapping creator address to bill id
    mapping(address => mapping(uint256 => uint256)) _creatorBills;

    // mapping debtor address to bill id
    mapping(address => mapping(uint256 => Debt)) _debtorBills;

    // mapping bill id to creator id
    mapping(uint256 => address) _billCreator;

    // mapping number of creator bills;
    mapping(address => uint256) public _createdBillOf;

    // mapping number of debtor bills;
    mapping(address => uint256) public _owedBillOf;

    // All Bill
    mapping(uint256 => Bill) _allBills;

    Counters.Counter public _billIndex;

    enum BillStatus {
        PENDING,
        PAID,
        CANCELLED
    }

    struct Participant {
        address _address;
    }

    struct DebtParticipant {
        address _address;
        uint256 amount;
    }

    struct Debt {
        uint256 amount;
        uint256 amountOut;
        bool hasPaid;
        uint256 paidAt;
    }

    // NOTE: issue an nft instead of storing data on blockchain
    struct Bill {
        address token;
        uint256 amount;
        uint256 amountPaid;
        uint256 paymentDue;
        uint256 createdAt;
        BillStatus status;
        address creator;
        address recipient;
    }

    modifier creatorOf(uint256 billIndex) {
        require(
            _billCreator[billIndex] == msg.sender,
            "Access denied. Only creator"
        );
        _;
    }

    modifier notPaused() {
        require(!_pauseContract, "Contract is paused");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// creates a new bill
    ///@dev function stack almost too deep
    function createBill(
        uint256 _amount,
        address _tokenAddress,
        uint256 _paymentDue,
        address _recipient,
        address _creator,
        DebtParticipant[] memory _debtors
    ) public notPaused {
        //data validation
        require(_amount > 0, "amount must be greater than 0");
        require(_recipient != address(0), "Invalid  recipient address");
        require(_creator != address(0), "Invalid  creator address");
        require(_tokenAddress != address(0), "Invalid token address");

        uint256 billIndex = _billIndex.current();
        _allBills[billIndex] = Bill({
            token: _tokenAddress,
            amount: _amount,
            recipient: _recipient,
            creator: _creator,
            createdAt: block.timestamp,
            status: BillStatus.PENDING,
            paymentDue: _paymentDue,
            amountPaid: 0
        });
        //create new Bill
        Bill storage bill = _allBills[billIndex];
        bill.amount = _amount;
        bill.token = _tokenAddress;
        bill.recipient = _recipient;
        bill.creator = _creator;
        bill.createdAt = block.timestamp;
        bill.status = BillStatus.PENDING;
        bill.paymentDue = _paymentDue;
        bill.amountPaid = 0;

        // assign bill index to creator
        _creatorBills[_creator][
            _createdBillOf[_creator] // number of bills created by `_creator`
        ] = billIndex;

        // increase the creators number of created bills
        _createdBillOf[_creator] += 1;

        // Implicit memory to storage conversion is not supported
        // so we do it manually
        for (uint256 idx; idx < _debtors.length; idx++) {
            address debtorAddress = _debtors[idx]._address;

            require(
                debtorAddress != address(0),
                "invalid address debtor or ENS name"
            );

            //get number of bill of debtor
            uint256 numberOfOwedBill = _owedBillOf[debtorAddress];

            // increase the number of debtors owed bills;
            _owedBillOf[debtorAddress] += 1;

            // assign bill index to debtor
            _debtorBills[debtorAddress][numberOfOwedBill] = Debt({
                amount: _debtors[idx].amount,
                hasPaid: false,
                paidAt: 0,
                amountOut: 0
            });

            // append debtor bill list of debtors
        }

        _billIndex.increment();

        emit BillCreated(
            billIndex,
            uint8(bill.status),
            _creator,
            _amount
        );
    }

    function swapExactInputSingle(
        address fromAsset,
        address toAsset,
        address sender,
        address recipient,
        uint24 poolFee,
        uint256 amountIn
    ) internal notPaused returns (uint256 amountOut) {
        // Transfer the specified amount of fromAsset to this contract
        TransferHelper.safeTransferFrom(
            fromAsset,
            sender,
            address(this),
            amountIn
        );

        // Approve the router to spend fromAsset
        TransferHelper.safeApprove(fromAsset, address(swapRouter), amountIn);

        // Naively set amountOutMinimum to 0. In production, use an oracle or other data source to choose a safer value for amountOutMinimum.
        // We also set the sqrtPriceLimitx96 to be 0 to ensure we swap our exact input amount. This can be  used to set the limit for the price the swap will push the pool to,
        // which can help protect against price impact or for setting up logic in a variety of price-relevant mechanisms
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: fromAsset,
                tokenOut: toAsset,
                fee: poolFee,
                recipient: recipient,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // The call to `exactInputSingle` executes the swap.
        amountOut = swapRouter.exactInputSingle(params);
    }

    function payDebt(
        address fromAsset,
        address debtorAddress,
        uint24 poolFee,
        uint256 amountIn,
        uint256 billIndex,
        uint256 debtIndex
    ) external {
        require(poolFee > 0, "Pool fee is not enough");
        require(amountIn > 0, "Amount sent is not enough");

        Bill storage bill = _allBills[billIndex];

        Debt storage debt = _debtorBills[debtorAddress][debtIndex];

        //swap asset to tagert asset and store on contract
        uint256 amountOut = swapExactInputSingle(
            fromAsset,
            bill.token,
            msg.sender,
            address(this),
            poolFee,
            amountIn
        );

        debt.amountOut += amountOut;
        bill.amountPaid += amountOut;

        if (debt.amountOut >= debt.amount) {
            debt.hasPaid = true;
        }

        debt.paidAt = block.timestamp;

        // if full amount has been collected, pay recipient
        if (bill.amountPaid >= bill.amount) {
            // clean paid amount record of all bill debtors
            // NOTE: THIS IS NOT LIKELY NECESSARY
            // for (uint256 idx; idx < bill.debtors.length; idx++) {
            //     bill.debtors[idx].amountOut = 0;
            // }

            uint256 totalCollectedAmount = bill.amountPaid;
            bill.amountPaid = 0;

            // use call instead of transfer
            (bool suc, ) = address(bill.token).call{gas: 1000000}(
                abi.encodeWithSignature(
                    "transfer(address,uint)",
                    bill.recipient,
                    totalCollectedAmount
                )
            );
            // ERC20(bill.token).transfer(
            //     bill.recipient._address,
            //     totalCollectedAmount
            // );
            if (suc) {
                delete _allBills[billIndex];
                delete _debtorBills[debtorAddress][debtIndex];
            }
        }

        emit DebtorPaid(
            billIndex,
            bill.recipient,
            debtorAddress,
            msg.sender,
            amountOut
        );
    }

    function pauseContract(bool status) external onlyOwner {
        _pauseContract = status;
    }
}
