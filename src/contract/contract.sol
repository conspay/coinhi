pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;
pragma experimental ABIEncoderV2;

import "../common/math.sol";
import "../common/strings.sol";
import "../common/ownable.sol";

contract SeroInterface {

    bytes32 private topic_sero_issueToken = 0x3be6bf24d822bcd6f6348f6f5a5c2d3108f04991ee63e80cde49a8c4746a0ef3;
    bytes32 private topic_sero_balanceOf = 0xcf19eb4256453a4e30b6a06d651f1970c223fb6bd1826a28ed861f0e602db9b8;
    bytes32 private topic_sero_send = 0x868bd6629e7c2e3d2ccf7b9968fad79b448e7a2bfb3ee20ed1acbc695c3c8b23;
    bytes32 private topic_sero_currency = 0x7c98e64bd943448b4e24ef8c2cdec7b8b1275970cfe10daf2a9bfa4b04dce905;
    bytes32 private topic_sero_setCallValues = 0xa6cafc6282f61eff9032603a017e652f68410d3d3c69f0a3eeca8f181aec1d17;

    function sero_setCallValues(string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal {
        bytes memory temp = new bytes(0x80);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _amount)
            mstore(add(temp, 0x40), _category)
            mstore(add(temp, 0x60), _ticket)
            log1(temp, 0x80, sload(topic_sero_setCallValues_slot))
        }
        return;
    }

    function sero_balanceOf(string memory _currency) internal returns (uint256 amount){
        bytes memory temp = new bytes(32);
        assembly {
            mstore(temp, _currency)
            log1(temp, 0x20, sload(topic_sero_balanceOf_slot))
            amount := mload(temp)
        }
    }


    function sero_msg_currency() internal returns (string memory) {
        bytes memory tmp = new bytes(32);
        bytes32 b32;
        assembly {
            log1(tmp, 0x20, sload(topic_sero_currency_slot))
            b32 := mload(tmp)
        }
        return strings._bytes32ToStr(b32);
    }

    function sero_issueToken(uint256 _total, string memory _currency) internal returns (bool success){
        bytes memory temp = new bytes(64);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _total)
            log1(temp, 0x40, sload(topic_sero_issueToken_slot))
            success := mload(add(temp, 0x20))
        }
    }

    function sero_send_token(address _receiver, string memory _currency, uint256 _amount) internal returns (bool success){
        return sero_send(_receiver, _currency, _amount, "", 0);
    }

    function sero_send(address _receiver, string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal returns (bool success){
        bytes memory temp = new bytes(160);
        assembly {
            mstore(temp, _receiver)
            mstore(add(temp, 0x20), _currency)
            mstore(add(temp, 0x40), _amount)
            mstore(add(temp, 0x60), _category)
            mstore(add(temp, 0x80), _ticket)
            log1(temp, 0xa0, sload(topic_sero_send_slot))
            success := mload(add(temp, 0x80))
        }
    }

}

interface MarketDex {

    function bigCustomerBuy(string memory exchangeCoin, address receiverAddr, bytes memory opData) external payable returns (uint256[] memory);

}

interface Oracle {
    function seroPrice(string memory fiat) external view returns (uint256, uint256);
}

interface CodeService {

    function encode(uint64 number) external view returns (string memory);

    function decode(string memory code) external view returns (uint64);
}


contract Config {

    uint256 constant star1_large_total = 5e23;
    uint256 constant star1_little_total = 5e22;

    uint256 constant star2_large_total = 1e24;
    uint256 constant star2_little_total = 2e23;

    uint256 constant star3_large_total = 2e24;
    uint256 constant star3_little_total = 4e23;

    uint256 constant star4_large_total = 4e24;
    uint256 constant star4_little_total = 8e23;

    uint256 constant star5_large_total = 8e24;
    uint256 constant star5_little_total = 16e23;

    uint256 constant star6_large_total = 16e24;
    uint256 constant star6_little_total = 32e23;

    uint256 constant vip_large_total = 16e24;
    uint256 constant vip_little_total = 60e23;
}

contract CoinH is SeroInterface, Ownable, Config {

    using SafeMath for uint256;

    uint256 constant private DAY = 24 * 60 * 60;

    uint256 constant private MAXHEIGHT = 150;
    string constant private SERO = "SERO";
    string constant private SCNY = "SCNY";
    string constant private POINTNAME = "COINHI";

    uint256 constant private N = 9997;
    uint256 constant private D = 10000;

    struct Investor {

        address investorAddr;
        uint256 refereeId;
        uint256 largeAreaId;

        uint256 value;
        uint256 frozenPoints;
        uint256 deathTime;

        uint256 canDrawupPoints;
        uint256 returnPoints;
        uint256 index;

        uint256 achievement;
        uint256 otherAchievement;

        uint256 star;
        bool isVip;
    }

    struct Details {
        string code;
        string refereeCode;
        string largeAreaCode;

        uint256 points;
        uint256 frozenPoints;
        uint256 canDrawupPoints;
        uint256 returnPoints;
        uint256 deathTime;

        uint256 achievement;
        uint256 largeAchievement;


        uint256 dayIncome;

        uint256 star;
        bool isVip;
        uint256 recommendProfit;
        uint256 starProfit;
        uint256 amount;
    }


    uint256 public rewardPool;

    uint256 public vipCount;

    struct WinnersInfo {
        uint256 shareRewardPool;
        string[] winnerCodes;
        uint256[] winnerRewards;
        uint256[] winnerShareValues;

        uint256 nowShareRewardPool;
        string[] topSixCodes;
        uint256[] topSixRewards;
        uint256[] topSixShareValues;
        uint256 drawTimeStamp;
        uint256 vipReward;
    }

    mapping(uint256 => uint256) public shareValues;
    mapping(uint256 => uint256) public recommendProfitMaps;
    mapping(uint256 => uint256) public starProfitMaps;

    uint256 public drawTimeStamp;
    mapping(uint256 => uint256) vipTimeStamps;

    uint256[] shareRewardRatios = [30, 25, 20, 15, 6, 4];
    mapping(uint256 => uint256) dayShareValues;
    mapping(uint256 => uint256) dayShareTimes;
    uint256[] public topSixList;

    uint256 public shareReward;
    uint256[] public winnersList;
    uint256[] public winnersShareValues;

    mapping(address => uint256) public indexs;
    Investor[] public investors;

    mapping(uint256 => uint256) public drawValuesMap;
    mapping(uint256 => uint256) public drawTimesMap;

    uint256 public heightValue;
    uint256 public preHeightValue;
    uint256 public deathTime;

    uint256 public _totalSupply;

    MarketDex dex;
    Oracle oracle;
    CodeService private codeService;

    address private marketAddr0;
    address private marketAddr1;

    constructor(address _codeServiceAddr, address _marketAddr0, address _marketAddr1) public payable {
        _insert(0, address(0));
        require(sero_issueToken(0, POINTNAME));
        codeService = CodeService(_codeServiceAddr);
        drawTimeStamp = now;

        marketAddr0 = _marketAddr0;
        marketAddr1 = _marketAddr1;
    }

    function registerNode(address addr) public onlyOwner {
        uint256 id = indexs[addr];
        require(id == 0, "address is exists");
        _insert(0, addr);
    }

    function setDexAddr(address _dexAddr) public onlyOwner {
        dex = MarketDex(_dexAddr);
    }

    function setOracle(address _addr) public onlyOwner {
        oracle = Oracle(_addr);
    }

    function getRatios() public view returns (uint256[] memory ratios) {
        require(address(oracle) != address(0), "not set oracle");
        ratios = new uint256[](2);
        (ratios[0], ratios[1]) = oracle.seroPrice("CNY");
        require(ratios[0] != 0 && ratios[1] != 0);
        return ratios;
    }

    function name() public pure returns (string memory) {
        return POINTNAME;
    }

    function symbol() public pure returns (string memory){
        return POINTNAME;
    }

    function decimals() public pure returns (uint8) {
        return 18;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function info() public view returns (uint256, uint256, uint256, uint256){

        return (heightValue, heightValue / 4 + rewardPool, preHeightValue, rewardPool);
    }

    function details() public view
    returns (Details memory ret) {

        uint256 id = indexs[msg.sender];
        if (id == 0) {
            return ret;
        }

        Investor memory i = investors[id];

        string memory code = codeService.encode(uint64(id));
        string memory refereeCode;
        if (i.refereeId != 0) {
            refereeCode = codeService.encode(uint64(i.refereeId));
        }

        uint256 points;
        uint256 canDrawupPoints;
        uint256 returnPoints;
        uint256 frozenPoints;
        uint256 dayIncome;
        uint256 index = now / DAY;
        if (i.index < index) {
            uint256 remainder = _remainderPoints(id);
            uint256 profile = _sumN(remainder, index - i.index);

            if (remainder < profile) {
                profile = remainder;
            }

            returnPoints = i.returnPoints.add(profile);
            canDrawupPoints = i.canDrawupPoints.add(profile);

            if (returnPoints >= _principal(id) && deathTime > i.deathTime) {
                frozenPoints = _enlarge(i.value).sub(returnPoints);
            } else {
                frozenPoints = i.frozenPoints;
            }

            points = _enlarge(i.value).sub(frozenPoints).sub(returnPoints);

        } else {
            canDrawupPoints = i.canDrawupPoints;
            returnPoints = i.returnPoints;
            frozenPoints = i.frozenPoints;
            points = _remainderPoints(id);
        }

        dayIncome = points * (D - N) / D;


        uint256 largeAchievement;
        string memory largeAreaCode;
        if (i.largeAreaId != 0) {
            largeAreaCode = codeService.encode(uint64(i.largeAreaId));
            largeAchievement = investors[i.largeAreaId].achievement.add(_principal(i.largeAreaId));
        }

        ret = Details({
            code : code,
            refereeCode : refereeCode,
            largeAreaCode : largeAreaCode,
            points : points,
            frozenPoints : frozenPoints,
            canDrawupPoints : canDrawupPoints,
            returnPoints : returnPoints,
            dayIncome : dayIncome,
            deathTime : i.deathTime,

            recommendProfit : recommendProfitMaps[id],
            starProfit : starProfitMaps[id],

            achievement : i.achievement + i.otherAchievement,
            largeAchievement : largeAchievement,
            star : i.star,
            isVip : i.isVip,
            amount : _principal(id)
            });
    }

    function winnersInfo() public view
    returns (WinnersInfo memory info) {
        string[] memory winnerCodes = new string[](winnersList.length);
        uint256[] memory winnerRewards = new uint256[](winnersList.length);
        for (uint256 i = 0; i < winnersList.length; i++) {
            winnerCodes[i] = codeService.encode(uint64(winnersList[i]));
            winnerRewards[i] = shareReward.mul(shareRewardRatios[i]) / 100;
        }


        uint256 nowShareRewardPool = rewardPool.div(20);

        uint256[] memory ids = _sortByShareValue(topSixList);
        string[] memory topSixCodes = new string[](ids.length);
        uint256[] memory topSixRewards = new uint256[](ids.length);
        uint256[] memory topSixShareValues = new uint256[](topSixCodes.length);
        for (uint256 i = 0; i < ids.length; i++) {
            topSixCodes[i] = codeService.encode(uint64(ids[i]));
            topSixRewards[i] = nowShareRewardPool.mul(shareRewardRatios[i]).div(100);
            topSixShareValues[i] = dayShareValues[ids[i]];
        }

        uint256 vipReward;
        uint256 id = indexs[msg.sender];


        if (investors[id].isVip && drawTimeStamp / DAY == now / DAY &&
        vipTimeStamps[id] / DAY != now / DAY) {
            vipReward = shareReward * 2 / vipCount;
        }

        info = WinnersInfo({
            shareRewardPool : shareReward,
            winnerCodes : winnerCodes,
            winnerRewards : winnerRewards,
            winnerShareValues : winnersShareValues,

            nowShareRewardPool : nowShareRewardPool,
            topSixCodes : topSixCodes,
            topSixRewards : topSixRewards,
            topSixShareValues : topSixShareValues,
            drawTimeStamp : drawTimeStamp,
            vipReward : vipReward
            });
    }


    function getPoint() public payable {
        require(strings._stringEq(SERO, sero_msg_currency()), "currency must SERO");

        rewardPool = rewardPool.add(msg.value * 3 / 100);

        uint256[] memory ratios = getRatios();

        uint256 value = msg.value.mul(ratios[0]).div(ratios[1]);
        _sendPoints(msg.sender, value);
        _afterChange();
    }

    function Agent(bytes memory opData) external payable returns (bool) {

        if (opData.length > 0) {
            (address investor, string memory code) = abi.decode(opData, (address, string));

            uint256 points = _investPoints();
            if (points == 0) {
                return false;
            }
            uint256 index = indexs[investor];
            if (index == 0) {
                uint256 refereeId;
                if (!strings._stringEq("", code)) {
                    refereeId = codeService.decode(code);
                }

                if (refereeId != 0 && refereeId < investors.length) {
                    index = _insert(refereeId, investor);
                } else {
                    return false;
                }

            }

            _investment(index, points);
        } else {
            if (!strings._stringEq(SERO, sero_msg_currency())) {
                return false;
            }
            _afterChange();
        }
        return true;
    }

    function takeVipReward() public {
        uint256 id = indexs[msg.sender];
        require(id != 0 && id < investors.length);
        require(drawTimeStamp / DAY == now / DAY);
        require(investors[id].isVip);
        require(vipTimeStamps[id] / DAY != now / DAY);


        vipTimeStamps[id] = now;

        uint256 amount = shareReward * 2 / vipCount;
        rewardPool = rewardPool.sub(amount);
        require(sero_send_token(msg.sender, SERO, amount));
    }


    function runALottery() public {
        require(drawTimeStamp / DAY != now / DAY);
        drawTimeStamp = now;

        delete winnersList;
        delete winnersShareValues;

        shareReward = rewardPool.div(20);

        uint256[] memory list = _sortByShareValue(topSixList);

        uint256 total;
        for (uint256 i = 0; i < list.length; i++) {
            winnersList.push(list[i]);
            winnersShareValues.push(dayShareValues[list[i]]);

            uint256 value = shareReward.mul(shareRewardRatios[i]) / 100;
            total += value;
            require(sero_send_token(investors[list[i]].investorAddr, SERO, value));
        }

        rewardPool = rewardPool.sub(total);
        delete topSixList;
    }

    function _sendPoints(address to, uint256 value) internal {
        uint256 balance = sero_balanceOf(POINTNAME);
        if (balance >= value) {
            require(sero_send_token(to, POINTNAME, value));
        } else {
            uint256 amount = value - balance;
            _totalSupply += amount;
            require(sero_issueToken(amount, POINTNAME));
            require(sero_send_token(to, POINTNAME, value));
        }
    }

    function _sendSERO(address to, uint256 value) internal returns (bool){
        if (sero_balanceOf(SERO) < value.add(rewardPool)) {
            return false;
        }
        return sero_send_token(to, SERO, value);
    }

    function withdraw(uint256 value, bool isSero) public {
        uint256 id = indexs[msg.sender];
        require(id != 0 && id < investors.length);
        require(value > 0 && value <= 5e22);

        value = _withdraw(id, value);
        if (value == 0) {
            return;
        }

        if (!isSero) {
            _sendPoints(msg.sender, value);
        } else {
            uint256[] memory ratios = getRatios();
            value = value.mul(ratios[1]).div(ratios[0]);
            require(_sendSERO(msg.sender, value));

            _afterChange();
        }
    }

    function _withdraw(uint256 id, uint256 value) internal returns (uint256) {
        _payStaticProfit(id);

        Investor storage investor = investors[id];

        if(value == 0) {
            value = investor.canDrawupPoints;
            if(value > 5e22) {
                value = 5e22;
            }
        }

        require(value <= investor.canDrawupPoints);

        if (drawTimesMap[id] / DAY == now / DAY) {
            require(drawValuesMap[id].add(value) <= 5e22);
            drawValuesMap[id] = drawValuesMap[id].add(value);
        } else {
            require(value <= 5e22);
            drawValuesMap[id] = value;
            drawTimesMap[id] = now;
        }

        investor.canDrawupPoints = investor.canDrawupPoints.sub(value);

        return value;
    }

    function thaw() public payable {
        require(strings._stringEq(SERO, sero_msg_currency()));
        uint256 id = indexs[msg.sender];
        require(id != 0 && id < investors.length);

        _payStaticProfit(id);

        uint256[] memory ratios = getRatios();
        uint256 value = msg.value.mul(ratios[0]).div(ratios[1]);

        if (investors[id].frozenPoints < value * 25) {
            investors[id].frozenPoints = 0;
        } else {
            investors[id].frozenPoints = investors[id].frozenPoints.sub(value * 25);
        }

        _afterChange();
    }

    function _investPoints() internal returns (uint256){
        string memory currency = sero_msg_currency();

        uint256[] memory ratios = getRatios();
        uint256 points;
        if (strings._stringEq(SERO, currency)) {
            points = msg.value.mul(ratios[0]).div(ratios[1]);
            rewardPool = rewardPool.add(msg.value * 3 / 100);
        } else if (strings._stringEq(SCNY, currency)) {
            points = msg.value;
            _exchange(currency, msg.value);
        } else if (strings._stringEq(POINTNAME, currency)) {
            points = msg.value;
        } else {
            require(false, "currency is error");
        }

        {
            uint256 seroAmount = points.mul(ratios[1]).div(ratios[0]);
            _sendSERO(owner, seroAmount / 100);
            _sendSERO(marketAddr0, seroAmount / 100);
            _sendSERO(marketAddr1, seroAmount * 3 / 100);
        }

        _afterChange();

        return points;
    }

    function investByContract(bytes memory opData) external payable returns (bool) {
        if (opData.length == 0) {
            return false;
        }

        (address refereeAddr, address investorAddr) = abi.decode(opData, (address, address));

        _investBy(refereeAddr, investorAddr);
    }

    function investByOther(address investorAddr) public payable {
        _investBy(msg.sender, investorAddr);
    }

    function _investBy(address refereeAddr, address investorAddr) internal {
        require(refereeAddr != investorAddr);
        uint256 refereeId = indexs[refereeAddr];
        require(refereeId != 0 && refereeId < investors.length);

        uint256 points = _investPoints();

        uint256 index = indexs[investorAddr];
        bool isFirst;
        if (index == 0) {
            isFirst = true;
            require(refereeId != 0 && refereeId < investors.length);
            index = _insert(refereeId, investorAddr);
        }

        _investment(refereeId, points.mul(2) / 25);

        _investment(index, points);


        if (isFirst) {
            uint256 amount = _withdraw(indexs[investorAddr], 0);
            uint256[] memory ratios = getRatios();
            require(_sendSERO(investorAddr, amount.mul(ratios[1]).div(ratios[0])));
        }
    }

    function investByCode(string memory code) public payable {

        uint256 points = _investPoints();

        uint256 index = indexs[msg.sender];
        if (index == 0) {
            uint256 refereeId;
            if (!strings._stringEq("", code)) {
                refereeId = codeService.decode(code);
            }
            require(refereeId != 0 && refereeId < investors.length);
            index = _insert(refereeId, msg.sender);
        }

        _investment(index, points);
    }

    function _investment(uint256 id, uint256 value) internal {
        Investor storage investor = investors[id];

        if (investor.value != 0) {
            uint256 profit = _enlarge(value).mul(D - N) / D;
            investor.canDrawupPoints = investor.canDrawupPoints.add(profit);
            investor.returnPoints = investor.returnPoints.add(profit);

            _payStaticProfit(id);
        }

        investor.value = investor.value.add(value);


        uint256 currentId = investor.refereeId;
        if (currentId != 0 && _remainderPoints(currentId) > 0) {
            shareValues[currentId] = shareValues[currentId].add(value);

            if (dayShareTimes[currentId] < drawTimeStamp) {
                dayShareValues[currentId] = value;
                dayShareTimes[currentId] = now;
            } else {
                dayShareValues[currentId] = dayShareValues[currentId].add(value);
            }
            _topSix(currentId);
        }

        uint256 childId = id;
        uint256 height;
        uint256 otherAmount = value;

        while (currentId != uint256(0)) {

            if (investors[childId].otherAchievement != 0) {
                otherAmount = otherAmount.add(investors[childId].otherAchievement);
                investors[childId].achievement = investors[childId].achievement.add(investors[childId].otherAchievement);

                investors[childId].otherAchievement = 0;
            }

            if (height == MAXHEIGHT && investors[currentId].refereeId != 0) {
                investors[currentId].otherAchievement = investors[currentId].otherAchievement.add(otherAmount);
                break;
            } else {
                investors[currentId].achievement = investors[currentId].achievement.add(otherAmount);
            }


            if (investors[currentId].largeAreaId == 0) {
                investors[currentId].largeAreaId = childId;
            } else {
                uint256 largeAreaId = investors[currentId].largeAreaId;
                uint256 largeAchievement = investors[largeAreaId].achievement.add(_principal(largeAreaId));
                uint256 childAchievement = investors[childId].achievement.add(_principal(childId));

                if (investors[currentId].largeAreaId != childId && childAchievement > largeAchievement) {
                    investors[currentId].largeAreaId = childId;
                    largeAchievement = childAchievement;
                }

                uint256 littleAchievement = (investors[currentId].achievement.add(investors[currentId].otherAchievement)).sub(largeAchievement);

                uint8 star;

                if (largeAchievement >= star6_large_total && littleAchievement >= star6_little_total) {
                    star = 6;
                } else if (largeAchievement >= star5_large_total && littleAchievement >= star5_little_total) {
                    star = 5;
                } else if (largeAchievement >= star4_large_total && littleAchievement >= star4_little_total) {
                    star = 4;
                } else if (largeAchievement >= star3_large_total && littleAchievement >= star3_little_total) {
                    star = 3;
                } else if (largeAchievement >= star2_large_total && littleAchievement >= star2_little_total) {
                    star = 2;
                } else if (largeAchievement >= star1_large_total && littleAchievement >= star1_little_total) {
                    star = 1;
                }


                if (star != investors[currentId].star) {
                    investors[currentId].star = star;
                }

                if (largeAchievement >= vip_large_total && littleAchievement >= vip_little_total) {
                    if (!investors[currentId].isVip) {
                        investors[currentId].isVip = true;
                        vipCount++;
                    }
                }
            }

            (childId, currentId) = (currentId, investors[currentId].refereeId);
            height++;
        }

        _starProfit(investor.refereeId, value);
        _recommendProfit(investor.refereeId, value);
    }

    function _insert(uint256 refereeId, address investorAddr) internal returns (uint256) {
        uint256 index = investors.length;
        indexs[investorAddr] = index;
        investors.push(Investor({investorAddr : investorAddr, refereeId : refereeId, largeAreaId : 0, value : 0, frozenPoints : 0, canDrawupPoints : 0, returnPoints : 0, index : now / DAY - 1,
            achievement : 0, otherAchievement : 0, star : 0, deathTime : 0, isVip : false
            }));
        return index;
    }


    function _starProfit(uint256 id, uint256 amount) internal {
        _starProfit0(id, amount);
        _starProfit1(id, amount);
    }

    function _starProfit0(uint256 id, uint256 amount) internal {
        if (id == 0) {
            return;
        }

        uint256 height;
        uint256 rate;
        while (id != 0 && height < MAXHEIGHT && rate < 7) {

            if (investors[id].star == 0) {
                id = investors[id].refereeId;
                height++;
                continue;
            }

            uint currentRate = investors[id].star + 1;
            if (currentRate <= rate) {
                id = investors[id].refereeId;
                height++;
                continue;
            }

            (rate, currentRate) = (currentRate, currentRate - rate);
            uint256 profit = amount.mul(currentRate) / 100;

            _payDynamicProfit(id, profit, false);

            id = investors[id].refereeId;
            height++;
        }
    }

    function _starProfit1(uint256 id, uint256 amount) internal {
        uint256 height;
        uint256[] memory starList = new uint256[](6);
        uint256 rate = 6;
        while (id != 0 && height < MAXHEIGHT && rate > 0) {
            if (investors[id].star > 0) {
                starList[investors[id].star - 1]++;
                if (starList[investors[id].star - 1] == 2) {
                    _payDynamicProfit(id, amount / 100, false);
                    rate--;
                }
            }
            id = investors[id].refereeId;
            height++;
        }
    }

    function _recommendProfit(uint256 firstId, uint256 amount) internal {
        if (firstId == 0) {
            return;
        }

        _payRecommendProfit(firstId, amount, 10);
        uint256 secondId = investors[firstId].refereeId;

        if (secondId != uint256(0)) {
            _payRecommendProfit(secondId, amount, 6);

            uint256 layer = 3;
            uint256 id = investors[secondId].refereeId;
            while (id != uint256(0) && layer <= 12) {
                if (_remainderPoints(id) >= _enlarge(1e23) || shareValues[id] / 1e22 >= layer) {
                    _payRecommendProfit(id, amount, 1);
                }

                id = investors[id].refereeId;
                layer += 1;
            }
        }
    }

    function _payRecommendProfit(uint256 id, uint256 amount, uint256 rate) internal {
        uint256 profile = amount.mul(rate) / 100;
        _payDynamicProfit(id, profile, true);
    }

    function _payDynamicProfit(uint256 id, uint256 value, bool flag) private {
        _payStaticProfit(id);

        if (flag) {
            recommendProfitMaps[id] = recommendProfitMaps[id].add(value);
        } else {
            starProfitMaps[id] = starProfitMaps[id].add(value);
        }

        investors[id].value = investors[id].value.add(value);
    }

    function _payStaticProfit(uint256 id) internal {
        Investor storage investor = investors[id];
        uint256 index = now / DAY;
        if (investor.index < index) {
            uint256 remainder = _remainderPoints(id);
            if (remainder == 0) {
                investor.index = index;
                return;
            }
            uint256 profit = _sumN(remainder, index - investor.index);
            investor.index = index;

            if (remainder < profit) {
                profit = remainder;
            }

            investor.returnPoints = investor.returnPoints.add(profit);
            investor.canDrawupPoints = investor.canDrawupPoints.add(profit);

            if (investor.returnPoints >= _principal(id) && deathTime > investor.deathTime) {
                investor.frozenPoints = _enlarge(investor.value).sub(investor.returnPoints);
                investor.deathTime = deathTime;
            }
        }
    }

    function _afterChange() private {

        uint256 currentBalance = sero_balanceOf(SERO);
        if (currentBalance <= rewardPool) {
            if (deathTime == 0) {
                deathTime = now;
            }
            return;
        }

        uint256 balance = currentBalance.sub(rewardPool);

        if (balance > heightValue) {
            heightValue = balance;
            if (heightValue > preHeightValue) {
                deathTime = 0;
            }
        } else {
            if (balance < heightValue / 4) {
                deathTime = now;
                preHeightValue = heightValue;
                heightValue = balance;
            }
        }
    }

    function _remainderPoints(uint256 id) internal view returns (uint256) {
        Investor storage investor = investors[id];
        return _enlarge(investor.value).sub(investor.frozenPoints).sub(investor.returnPoints);
    }

    function _principal(uint256 id) internal view returns (uint256) {
        return investors[id].value.sub(recommendProfitMaps[id]).sub(starProfitMaps[id]);
    }

    function _exchange(string memory token, uint256 value) internal {
        require(address(dex) != address(0), "not set dex");
        if (value > 0) {
            sero_setCallValues(token, value, "", bytes32(0));
            require(dex.bigCustomerBuy(SERO, address(this), new bytes(0)).length > 0, "call dex error");
        }
    }

    function _topSix(uint256 _id) internal {
        if (topSixList.length == 0) {
            topSixList.push(_id);
        } else {
            uint256 _minIndex;
            for (uint256 i = 0; i < topSixList.length; i++) {
                if (_id == topSixList[i]) {
                    return;
                }
                if (dayShareValues[topSixList[i]] < dayShareValues[topSixList[_minIndex]]) {
                    _minIndex = i;
                }
            }

            if (topSixList.length < 6) {
                topSixList.push(_id);
            } else if (dayShareValues[_id] > dayShareValues[topSixList[_minIndex]]) {
                topSixList[_minIndex] = _id;
            }
        }
    }

    function _an(uint256 a1, uint256 n) internal pure returns (uint256 an) {
        if (n == 0) {
            return a1;
        }

        uint256 m = n / 10;
        uint256 remainder = n % 10;

        for (uint256 i = 0; i < m; i++) {
            an = a1.mul(N ** 9).div(D ** 9);
            a1 = an * N / D;
        }

        if (remainder > 0) {
            an = a1.mul(N ** (remainder - 1)).div(D ** (remainder - 1));
        }
    }

    function _sumN(uint256 a1, uint256 n) internal pure returns (uint256 sum) {
        if (n == 0) {
            return (0);
        }

        uint256 m = n / 10;
        uint256 remainder = n % 10;

        uint256 an;

        for (uint256 i = 0; i < m; i++) {
            an = a1.mul(N ** 9).div(D ** 9);
            sum = sum.add(a1.sub(an.mul(N).div(D)));
            a1 = an * N / D;
        }

        if (remainder > 0) {
            an = a1.mul(N ** (remainder - 1)).div(D ** (remainder - 1));
            sum = sum.add(a1.sub(an.mul(N).div(D)));
        }

        return (sum);
    }

    function _enlarge(uint256 value) internal pure returns (uint256) {
        return value.mul(125).div(10);
    }

    function _sortByShareValue(uint256[] memory list) internal view returns (uint256[] memory) {
        if (list.length == 0) {
            return list;
        }
        uint256 _maxIndex;
        for (uint256 i = 0; i < list.length - 1; i++) {
            _maxIndex = i;
            for (uint256 j = i + 1; j < list.length; j++) {
                if (dayShareValues[list[_maxIndex]] < dayShareValues[list[j]]) {
                    _maxIndex = j;
                }
            }
            if (_maxIndex != i) {
                uint256 temp = list[i];
                list[i] = list[_maxIndex];
                list[_maxIndex] = temp;
            }
        }
        return list;
    }
}