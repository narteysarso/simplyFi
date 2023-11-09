//SPDX-License-Identifier: MIT

pragma solidity 0.8.20;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimplyFiSplit is Ownable {
    using Counters for Counters.Counter;

    event ExpenseCreated(
        uint256 indexed index,
        uint8 category,
        uint8 status,
        address indexed creator,
        string name,
        string description,
        uint256 amount
    );

    event DebtorPaid(
        uint256 indexed index,
        address indexed recipient,
        address indexed debtor,
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
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    //pause contract during emergency
    bool _pauseContract = false;

    address _swapContractAddress;

    address _lpTokenContractAddress;

    // mapping creator address to expense id
    mapping(address => mapping(uint256 => uint256)) _creatorExpenses;

    // mapping debtor address to expense id
    mapping(address => mapping(uint256 => uint256)) _debtorExpenses;

    // mapping expense id to creator id
    mapping(uint256 => address) _expenseCreator;

    // mapping number of creator expenses;
    mapping(address => uint256) _createdExpenseOf;

    // mapping number of debtor expenses;
    mapping(address => uint256) _owedExpenseOf;

    // All Expense
    mapping(uint256 => Expense) _allExpenses;

    Counters.Counter _expenseIndex;

    enum ExpenseStatus {
        PENDING,
        PAID,
        CANCELLED
    }

    enum ExpenseCategory {
        ACCOMODATION,
        TRANSPORTATION,
        FOOD,
        MISC
    }

    struct Participant {
        address _address;
    }

    struct DebtParticipant {
        address _address;
        uint256 amount;
    }

    struct Debtor {
        address _address;
        uint256 amount;
        uint256 amountOut;
        bool hasPaid;
        uint256 paidAt;
    }

    struct Expense {
        string name;
        string description;
        ExpenseCategory category;
        address token;
        uint256 amount;
        uint256 amountPaid;
        uint256 paymentDue;
        uint256 createdAt;
        ExpenseStatus status;
        Participant creator;
        Participant recipient;
        Debtor[] debtors; //USE MAPPING AND BUBBLE DATA UP
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
        string memory _name,
        string memory _description,
        uint256 _amount,
        address _tokenAddress,
        ExpenseCategory _category,
        uint256 _paymentDue,
        Participant memory _recipient,
        Participant memory _creator,
        DebtParticipant[] memory _debtors
    ) public notPaused {
        //data validation
        require(bytes(_name).length > 0, "Expense name is required");
        require(_amount > 0, "amount must be greater than 0");

        require(
            _recipient._address != address(0),
            "Invalid  recipient address or ENS names"
        );

        uint256 expenseIndex = _expenseIndex.current();

        //create new Expense
        Expense storage expense = _allExpenses[expenseIndex];
        expense.name = _name;
        expense.description = _description;
        expense.amount = _amount;
        expense.token = _tokenAddress;
        expense.recipient = _recipient;
        expense.creator = _creator;
        expense.createdAt = block.timestamp;
        expense.category = _category;
        expense.status = ExpenseStatus.PENDING;
        expense.paymentDue = _paymentDue;
        expense.amountPaid = 0;

        // assign expense index to creator
        _creatorExpenses[_creator._address][
            _createdExpenseOf[_creator._address] // number of expenses created by `_creator._address`
        ] = expenseIndex;

        // increase the creators number of created expenses
        _createdExpenseOf[_creator._address] += 1;

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
            _debtorExpenses[debtorAddress][numberOfOwedExpense] = expenseIndex;

            // append debtor expense list of debtors
            expense.debtors.push(
                Debtor({
                    _address: debtorAddress,
                    amount: _debtors[idx].amount,
                    hasPaid: false,
                    paidAt: 0,
                    amountOut: 0
                })
            );
        }

        _expenseIndex.increment();

        emit ExpenseCreated(
            expenseIndex,
            uint8(_category),
            uint8(expense.status),
            _creator._address,
            _name,
            _description,
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

    function getNumberOfCreatedExpenses(address _creatorAddress)
        external
        view
        notPaused
        returns (uint256)
    {
        require(_creatorAddress != address(0), "Invalid address");
        return _createdExpenseOf[_creatorAddress];
    }

    function getNumberOfOwedExpenses(address _debtorAddress)
        external
        view
        notPaused
        returns (uint256)
    {
        require(_debtorAddress != address(0), "Invalid address");
        return _owedExpenseOf[_debtorAddress];
    }

    function getCreatedExpense(address _creatorAddress, uint256 index)
        external
        view
        notPaused
        returns (
            string memory,
            string memory,
            ExpenseCategory,
            address,
            uint256,
            uint256,
            uint256,
            ExpenseStatus,
            address,
            address,
            Debtor[] memory
        )
    {
        uint256 expenseIndex = _creatorExpenses[_creatorAddress][index];
        Expense storage expense = _allExpenses[expenseIndex];

        return (
            expense.name,
            expense.description,
            expense.category,
            expense.token,
            expense.amount,
            expense.paymentDue,
            expense.createdAt,
            expense.status,
            expense.creator._address,
            expense.recipient._address,
            expense.debtors
        );
    }

    function payDebt(
        address fromAsset,
        uint24 poolFee,
        uint256 amountIn,
        uint256 index
    ) external {
        require(poolFee > 0, "Pool fee is not enough");
        require(amountIn > 0, "Amount sent is not enough");

        uint256 expenseIndex = _debtorExpenses[msg.sender][index];
        Expense storage expense = _allExpenses[expenseIndex];
        uint256 debtIndex = getDebt(expenseIndex, msg.sender);

        Debtor storage debtor = expense.debtors[debtIndex];

        //TODO: check to see required amount is available in the pool

        //swap asset to tagert asset and store on contract
        uint256 amountOut = swapExactInputSingle(
            fromAsset,
            expense.token,
            msg.sender,
            address(this),
            poolFee,
            amountIn
        );

        debtor.amountOut += amountOut;
        expense.amountPaid += amountOut;

        if (debtor.amountOut >= debtor.amount) {
            debtor.hasPaid = true;
        }

        debtor.paidAt = block.timestamp;

        // if full amount has been collected, pay recipient
        if (expense.amountPaid >= expense.amount) {
            // clean paid amount record of all expense debtors
            for (uint256 idx; idx < expense.debtors.length; idx++) {
                expense.debtors[idx].amountOut = 0;
            }

            uint256 totalCollectedAmount = expense.amountPaid;
            expense.amountPaid = 0;

            ERC20(expense.token).transfer(
                expense.recipient._address,
                totalCollectedAmount
            );
        }

        emit DebtorPaid(
            expenseIndex,
            expense.recipient._address,
            msg.sender,
            amountOut
        );
    }

    // get owed expenses detail of address
    function getOwedExpense(address _debtorAddress, uint256 index)
        external
        view
        notPaused
        returns (
            string memory,
            string memory,
            ExpenseCategory,
            address,
            uint256,
            uint256,
            uint256,
            ExpenseStatus,
            address,
            address,
            Debtor[] memory
        )
    {
        uint256 expenseIndex = _debtorExpenses[_debtorAddress][index];
        Expense storage expense = _allExpenses[expenseIndex];

        return (
            expense.name,
            expense.description,
            expense.category,
            expense.token,
            expense.amount,
            expense.paymentDue,
            expense.createdAt,
            expense.status,
            expense.creator._address,
            expense.recipient._address,
            expense.debtors
        );
    }

    function getDebt(uint256 expenseId, address _debtorAddress)
        public
        view
        returns (uint256)
    {
        Expense storage expense = _allExpenses[expenseId];

        // Doesn't cost gas in a view function.
        // But can stopped by miner if it takes too long
        for (uint256 idx; idx < expense.debtors.length; idx++) {
            if (expense.debtors[idx]._address == _debtorAddress) {
                return idx;
            }
        }
        return 0;
    }

    function pauseContract(bool status) external onlyOwner {
        _pauseContract = status;
    }
}
