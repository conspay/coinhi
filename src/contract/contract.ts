import Config from './config'
import BigNumber from "bignumber.js";
import {fromValue} from "../common/utils";
import service from "../service";

const serojs = require("serojs")
const seropp = require("sero-pp")

export interface Params {
    from?: string
    to: string
    cy?: string
    value?: string
    gas?: string
    gasPrice?: string
    data?: string
}

export interface Details {
    code: string;
    refereeCode: string;
    largeAreaCode: string;
    points: BigNumber;
    frozenPoints: BigNumber;
    canDrawupPoints: BigNumber;
    returnPoints: BigNumber;
    deathTime: BigNumber;
    achievement: BigNumber;
    largeAchievement: BigNumber;
    dayIncome: BigNumber;
    star: string;
    isVip: boolean;
    recommendProfit:BigNumber;
    starProfit:BigNumber;
}

export interface WinnersInfo {
    shareRewardPool: string;
    winnerCodes: Array<string>;
    winnerRewards: Array<string>;
    winnerShareValues: Array<string>;

    nowShareRewardPool: string;
    topSixCodes: Array<string>;
    topSixRewards:Array<string>;
    topSixShareValues: Array<string>;
    drawTimeStamp:any;
    vipReward: string;
}


class Contract {

    contract: any

    constructor() {
        const config = new Config();
        this.contract = serojs.callContract(config.abi, config.address);
    }

    async details(from: string): Promise<Details> {
        const d:any = await this.call("details", [], from)
        const detail = d[0]
        const rest:Details = {
            code:detail[0],
            refereeCode:detail[1],
            largeAreaCode:detail[2],
            points:fromValue(detail[3]),
            frozenPoints:fromValue(detail[4]),
            canDrawupPoints:fromValue(detail[5]),
            returnPoints:fromValue(detail[6]),
            deathTime:fromValue(detail[7]),
            achievement:fromValue(detail[8]),
            largeAchievement:fromValue(detail[9]),
            dayIncome:fromValue(detail[10]),
            star:detail[11],
            isVip:detail[12],
            recommendProfit:fromValue(detail[13]),
            starProfit:fromValue(detail[14]),
        }
        console.log("details",detail,rest);
        return rest
    }

    async winnersInfo(from: string): Promise<WinnersInfo> {
        const d = await this.call("winnersInfo", [], from)
        const detail = d[0]
        const rest:WinnersInfo = {
            shareRewardPool: detail[0],
            winnerCodes: detail[1],
            winnerRewards: detail[2],
            winnerShareValues: detail[3],
            nowShareRewardPool: detail[4],
            topSixCodes: detail[5],
            topSixRewards: detail[6],
            topSixShareValues: detail[7],
            drawTimeStamp:detail[8],
            vipReward: detail[9]
        }
        console.log("winnersInfo",rest)
        return rest

    }

    async getRatios(from: string): Promise<any> {
        const d = await this.call("getRatios", [], from)
        return d[0]
    }

    //===== execute

    async takeVipReward(account: any,): Promise<string> {
        return this.execute("takeVipReward", [], account)
    }

    async thaw(account: any,amount:BigNumber): Promise<string> {
        return this.execute("thaw", [], account,"SERO","0x"+amount.toString(16))
    }

    async getPoint(account: any,amount:BigNumber): Promise<string> {
        return this.execute("getPoint", [], account,"SERO","0x"+amount.toString(16))
    }

    async investProxy(account: any,address:string,amount:BigNumber,cy:string,value:BigNumber): Promise<string> {
        return this.execute("investByOther", [address], account,cy,"0x"+value.toString(16))
    }

    async investByCode(account: any, code:string,cy:string,value:BigNumber): Promise<string> {
        console.log("invest",code,cy);
        return this.execute("investByCode", [code], account,cy,"0x"+value.toString(16))
    }

    async reInvest(account: any,amount:BigNumber): Promise<string> {
        return this.execute("reInvest", ["0x"+amount.toString(16)], account)
    }

    async runALottery(account: any,): Promise<string> {
        return this.execute("runALottery", [], account)
    }

    async withdraw(account: any,amount:BigNumber,isSero:boolean): Promise<string> {
        return this.execute("withdraw", ["0x"+amount.toString(16),isSero], account)
    }

    async call(method: string, args: Array<any>, from: string): Promise<any> {

        const packData: any = this.contract.packData(method, args, true)

        const contract = this.contract;

        console.log("rest call>>> ",method);

        return new Promise((resolve, reject) => {
            const params: Params = {
                to: this.contract.address
            }
            params.from = from
            params.data = packData;

            service.rpc("sero_call",[params,"latest"]).then(data=>{
                if(data !="0x"){
                    const rest: any = contract.unPackDataEx(method, data)
                    resolve(rest)
                }else{
                    // alert(alertmethod+"---"+data);
                }
            }).catch(err=>{
                reject(err)
            })

        })
    }

    async execute(method: string, args: Array<any>, account: any, cy?: string, value?: string):Promise<any> {
        const packData: any = this.contract.packData(method, args, true)

        return new Promise((resolve, reject) => {
            const params: Params = {
                to: this.contract.address
            }
            params.from = account.MainPKr
            params.data = packData;
            if (cy) {
                params.cy = cy;
            }
            if (value) {
                params.value = value;
            }
            service.rpc("sero_estimateGas",[params]).then((data:any)=>{
                params.gas = data;
                params.from = account.PK
                seropp.executeContract(params, function (hash: any, err: any) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(hash)
                    }
                })
            }).catch(e=>{
                reject(e)
            })
        })
    }

}

const contract = new Contract();

export default contract