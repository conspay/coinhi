export default class Config {

    address:string ="2krq6zAYHv4f3jhrUKqhz9cutG5JcPYzXPzG7GiMrqn41opXfWTRkzEq2eM2tDXNpcgxj3YeSjF5rJEXRS5XJXwi"

    abi:any = [
        {
            "inputs": [],
            "name": "details",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "string",
                            "name": "code",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "refereeCode",
                            "type": "string"
                        },
                        {
                            "internalType": "string",
                            "name": "largeAreaCode",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "points",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "frozenPoints",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "canDrawupPoints",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "returnPoints",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "deathTime",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "achievement",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "largeAchievement",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "dayIncome",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "star",
                            "type": "uint256"
                        },
                        {
                            "internalType": "bool",
                            "name": "isVip",
                            "type": "bool"
                        },
                        {
                            "internalType": "uint256",
                            "name": "recommendProfit",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "starProfit",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct invest.Details",
                    "name": "ret",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getPoint",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getRatios",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "",
                    "type": "uint256[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "code",
                    "type": "string"
                }
            ],
            "name": "investByCode",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "investorAddr",
                    "type": "address"
                }
            ],
            "name": "investByOther",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "investorAddr",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "investProxy",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "reInvest",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "runALottery",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "takeVipReward",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "thaw",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "winnersInfo",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "uint256",
                            "name": "shareRewardPool",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string[]",
                            "name": "winnerCodes",
                            "type": "string[]"
                        },
                        {
                            "internalType": "uint256[]",
                            "name": "winnerRewards",
                            "type": "uint256[]"
                        },
                        {
                            "internalType": "uint256[]",
                            "name": "winnerShareValues",
                            "type": "uint256[]"
                        },
                        {
                            "internalType": "uint256",
                            "name": "nowShareRewardPool",
                            "type": "uint256"
                        },
                        {
                            "internalType": "string[]",
                            "name": "topSixCodes",
                            "type": "string[]"
                        },
                        {
                            "internalType": "uint256[]",
                            "name": "topSixRewards",
                            "type": "uint256[]"
                        },
                        {
                            "internalType": "uint256[]",
                            "name": "topSixShareValues",
                            "type": "uint256[]"
                        },
                        {
                            "internalType": "uint256",
                            "name": "drawTimeStamp",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "vipReward",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct invest.WinnersInfo",
                    "name": "info",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "value",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "isSero",
                    "type": "bool"
                }
            ],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
}