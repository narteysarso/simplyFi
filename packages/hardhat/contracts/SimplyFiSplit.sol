//SPDX-License-Identifier: MIT

pragma solidity 0.8.20;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimplyFySplit is Ownable {
    using Counters for Counters.Counter;

    event ExpenseCreated(
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

    event ExpenseCancelled(
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

    // mapping creator address to expense id
    mapping(address => mapping(uint256 => uint256)) _creatorExpenses;

    // mapping debtor address to expense id
    mapping(address => mapping(uint256 => Debt)) _debtorExpenses;

    // mapping expense id to creator id
    mapping(uint256 => address) _expenseCreator;

    // mapping number of creator expenses;
    mapping(address => uint256) public _createdExpenseOf;

    // mapping number of debtor expenses;
    mapping(address => uint256) public _owedExpenseOf;

    // All Expense
    mapping(uint256 => Expense) _allExpenses;

    Counters.Counter public _expenseIndex;

    enum ExpenseStatus {
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
    struct Expense {
        address token;
        uint256 amount;
        uint256 amountPaid;
        uint256 paymentDue;
        uint256 createdAt;
        ExpenseStatus status;
        address creator;
        address recipient;
    }

    modifier creatorOf(uint256 expenseIndex) {
        require(
            _expenseCreator[expenseIndex] == msg.sender,
            "Access denied. Only creator"
        );
        _;
    }

    modifier notPaused() {
        require(!_pauseContract, "Contract is paused");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// creates a new expense
    ///@dev function stack almost too deep
    function createExpense(
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

        uint256 expenseIndex = _expenseIndex.current();
        _allExpenses[expenseIndex] = Expense({
            token: _tokenAddress,
            amount: _amount,
            recipient: _recipient,
            creator: _creator,
            createdAt: block.timestamp,
            status: ExpenseStatus.PENDING,
            paymentDue: _paymentDue,
            amountPaid: 0
        });
        //create new Expense
        Expense storage expense = _allExpenses[expenseIndex];
        expense.amount = _amount;
        expense.token = _tokenAddress;
        expense.recipient = _recipient;
        expense.creator = _creator;
        expense.createdAt = block.timestamp;
        expense.status = ExpenseStatus.PENDING;
        expense.paymentDue = _paymentDue;
        expense.amountPaid = 0;

        // assign expense index to creator
        _creatorExpenses[_creator][
            _createdExpenseOf[_creator] // number of expenses created by `_creator`
        ] = expenseIndex;

        // increase the creators number of created expenses
        _createdExpenseOf[_creator] += 1;

        // Implicit memory to storage conversion is not supported
        // so we do it manually
        for (uint256 idx; idx < _debtors.length; idx++) {
            address debtorAddress = _debtors[idx]._address;

            require(
                debtorAddress != address(0),
                "invalid address debtor or ENS name"
            );

            //get number of expense of debtor
            uint256 numberOfOwedExpense = _owedExpenseOf[debtorAddress];

            // increase the number of debtors owed expenses;
            _owedExpenseOf[debtorAddress] += 1;

            // assign expense index to debtor
            _debtorExpenses[debtorAddress][numberOfOwedExpense] = Debt({
                amount: _debtors[idx].amount,
                hasPaid: false,
                paidAt: 0,
                amountOut: 0
            });

            // append debtor expense list of debtors
        }

        _expenseIndex.increment();

        emit ExpenseCreated(
            expenseIndex,
            uint8(expense.status),
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
        uint256 expenseIndex,
        uint256 debtIndex
    ) external {
        require(poolFee > 0, "Pool fee is not enough");
        require(amountIn > 0, "Amount sent is not enough");

        Expense storage expense = _allExpenses[expenseIndex];

        Debt storage debt = _debtorExpenses[debtorAddress][debtIndex];

        //swap asset to tagert asset and store on contract
        uint256 amountOut = swapExactInputSingle(
            fromAsset,
            expense.token,
            msg.sender,
            address(this),
            poolFee,
            amountIn
        );

        debt.amountOut += amountOut;
        expense.amountPaid += amountOut;

        if (debt.amountOut >= debt.amount) {
            debt.hasPaid = true;
        }

        debt.paidAt = block.timestamp;

        // if full amount has been collected, pay recipient
        if (expense.amountPaid >= expense.amount) {
            // clean paid amount record of all expense debtors
            // NOTE: THIS IS NOT LIKELY NECESSARY
            // for (uint256 idx; idx < expense.debtors.length; idx++) {
            //     expense.debtors[idx].amountOut = 0;
            // }

            uint256 totalCollectedAmount = expense.amountPaid;
            expense.amountPaid = 0;

            // use call instead of transfer
            (bool suc, ) = address(expense.token).call{gas: 1000000}(
                abi.encodeWithSignature(
                    "transfer(address,uint)",
                    expense.recipient,
                    totalCollectedAmount
                )
            );
            // ERC20(expense.token).transfer(
            //     expense.recipient._address,
            //     totalCollectedAmount
            // );
            if (suc) {
                delete _allExpenses[expenseIndex];
                delete _debtorExpenses[debtorAddress][debtIndex];
            }
        }

        emit DebtorPaid(
            expenseIndex,
            expense.recipient,
            debtorAddress,
            msg.sender,
            amountOut
        );
    }

    function pauseContract(bool status) external onlyOwner {
        _pauseContract = status;
    }
}
