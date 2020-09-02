import BigNumber from 'bignumber.js'

export function ellipsisAddress(addr:string) {
    if(addr && addr.length>10){
        return addr.substring(0,5) + "..." + addr.substring(addr.length-5);
    }
    return addr;
}

export function fromValue(value:string | BigNumber | number | undefined) {
    if(value){
        return new BigNumber(value).dividedBy(new BigNumber(10).pow(18))
    }
    return new BigNumber(0)
}

export function toValue(value:string | BigNumber | number | undefined) {
    if(value){
        return new BigNumber(value).multipliedBy(new BigNumber(10).pow(18))
    }
    return new BigNumber(0)
}

export function formatDate(time:number):string {
    return new Date(time).toLocaleDateString() + " " + new Date(time).toLocaleTimeString()
}