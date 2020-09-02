import {
    IonContent, IonHeader, IonPage, IonTitle, IonToolbar ,
    IonRow,IonCol,IonButton,IonItem,IonAvatar,IonLabel,IonList,
    IonIcon,IonItemDivider,IonText,IonPopover,IonModal,IonToggle,
    IonCheckbox,IonInput,IonToast,IonAlert,IonRadio,IonRadioGroup,IonListHeader,IonBadge
} from '@ionic/react';
import React from 'react';
import {serverOutline,rocketOutline,walletOutline,ribbon,chevronForward,star,starOutline,copyOutline,logoGithub} from 'ionicons/icons'
import './Home.css';
import {ellipsisAddress,fromValue,toValue,formatDate} from '../common/utils'
import BigNumber from 'bignumber.js'
import contract, {Details, Params, WinnersInfo} from "../contract/contract";
import service from "../service";
import { Avatar, Options } from 'react-avataaars';
import copy from 'copy-to-clipboard';

import Countdown from 'react-countdown';
import vip from '../icon/VIP.svg'
import i18n from '../common/i18n'

const seropp = require('sero-pp');
const QRCode = require('qrcode')
const coink = "COINHI";


const options: Options = {
    clothes: 'overall',
    eyebrow: 'default',
    eyes:"happy",
    mouth:"smile",
    style: 'circle',
};

//7qOreVoyxcF

let myCode = "";

interface State {
    account:any
    accounts:Array<any>
    showPopover:boolean
    showModal:boolean
    showModalDeposit:boolean
    showModalWithdraw:boolean
    checked:boolean

    checkAccount:boolean
    checkAccountSUSD:boolean
    checkAccountPoints:boolean
    showModalDetail:boolean

    code:string
    amount:any
    amountWithdraw:any
    amountProxy:any
    selectedCoin:any
    selectedProxyCoin:any

    toastMsg:string,
    showToast:boolean,

    detail?:Details
    winnersInfo?:WinnersInfo

    showModalProxy:boolean
    showAlert:boolean
    showAlertExchange:boolean

    radio:any
}

class Home extends React.Component<State, any>{

    state:State = {
        account:{},
        accounts:[],
        showPopover:false,
        showModal:false,
        showModalDeposit:false,
        showModalWithdraw:false,
        checked:false,
        checkAccount:true,
        checkAccountSUSD:false,
        checkAccountPoints:false,
        showModalProxy:false,
        showModalDetail:false,

        code:'',
        amount:"",
        amountWithdraw:"",
        showToast:false,
        selectedCoin:coink,
        selectedProxyCoin:"SERO",
        toastMsg:'',
        showAlert:false,
        showAlertExchange:false,
        amountProxy:"",

        radio:[1,1]


    }


    componentDidMount(): void {
        const that = this;
        document.body.classList.toggle('dark', true);
        service.initDApp().catch()

        // @ts-ignore
        const address:string = this.props.match.params.address;
        if(address){
            this.setShowModalProxy(true);
        }

        let intervalId:any = sessionStorage.getItem("intervalId");
        if(intervalId){
            clearInterval(intervalId);
        }

        that.getAccounts().then(()=>{
            that.getDetail().then()

            intervalId = setInterval(function () {
                that.getDetail().then(()=>{
                    that.getAccountDetail()
                })
            },10*1000);

            sessionStorage.setItem("intervalId",intervalId)
        })
        //for test
    }

    getAccountDetail = () =>{
        const {account} = this.state;
        const that = this;
        if(account && account.MainPKr){
            seropp.getAccountDetail(account.PK,function (data:any) {
                that.setState({
                    account:data
                })
            })
        }
    }

    async getAccounts(){
        const that = this;

        const cacheMainPKr = localStorage.getItem("account")
        seropp.getAccountList(function (accounts:any) {
            let act:any;
            for(let data of accounts){
                if(cacheMainPKr){
                    if( data.MainPKr === cacheMainPKr){
                        act = data;
                    }
                }else if(data.IsCurrent){
                    act = data;
                }

                if(act){
                    break
                }
            }

            if(!act && !cacheMainPKr){
                act = accounts[0]
            }

            that.setState({
                account:act,
                accounts:accounts
            })
            setTimeout(()=>{
                that.genQRCode(act).catch()
                that.getDetail(act).then()
            },100)
        })
    }

    async getDetail(act?:any){

        let {account} = this.state;
        if(act){
            account = act;
        }
        if(account){
            const detail:Details = await contract.details(account.MainPKr);
            const winnersInfo:WinnersInfo = await contract.winnersInfo(account.MainPKr);
            const radio:any = await contract.getRatios(account.MainPKr);
            if(detail){
                myCode = detail.code;
            }
            this.setState({
                detail:detail,
                winnersInfo:winnersInfo,
                radio:radio
            })
        }

    }

    async genQRCode(account:any){
        let canvas = document.getElementById('canvas')
        if(canvas){
            QRCode.toCanvas(canvas, window.location.origin + window.location.pathname + "#/"+account.MainPKr,{width:168,height:168}, function (error:any) {
                if (error) console.error(error)
                console.log('success!');
            })
        }
    }


    setShowPopover=(f:boolean) =>{
        this.setState({
            showPopover:f
        })
    }

    setAccount = (value:any)=>{
        localStorage.setItem("account",value.MainPKr)
        this.setState({
            account:value,
            showPopover:false
        })
        this.getDetail(value);
        this.genQRCode(value).then()
    }

    setShowModal = (f:boolean) =>{
        this.setState({
            showModal:f
        })
    }

    setShowModalDeposit = (f:boolean) =>{
        this.setState({
            showModalDeposit:f
        })
    }

    setShowModalProxy = (f:boolean) =>{
        this.setState({
            showModalProxy:f
        })
    }

    setShowModalWithdraw = (f:boolean) =>{
        this.setState({
            showModalWithdraw:f
        })
    }

    setChecked = (f1:boolean,f2:boolean) =>{
        this.setState({
            checkAccount:f1,
            checkAccountPoints:f2,
        })
    }

    setAmount = (v:any) =>{
        this.setState({
            amount:v
        })
    }

    setAmountWithdraw = (v:any) =>{
        this.setState({
            amountWithdraw:v
        })
    }

    setAmountProxy = (v:any) =>{
        this.setState({
            amountProxy:v
        })
    }

    confirm(){
        const {amount,checkAccountPoints,checkAccountSUSD,code,account,detail} = this.state;

        const amountBig:BigNumber = new BigNumber(amount);
        if(amountBig.comparedTo(0) <= 0){
            this.toast(i18n.t("moreThanZero"))
            return
        }
        let balance:any = this.getBalance();

        let cy = "SERO";
        if(checkAccountPoints){
            cy = coink;
        }
        if(!balance){
            this.toast(i18n.t("lessBalance"))
            return
        }else if(fromValue(balance.get(cy)).comparedTo(amountBig) <0 ){
            this.toast(i18n.t("lessBalance"))
            return
        }
        contract.investByCode(account,detail && detail.code?detail.code:code,cy,toValue(amount)).then(hash=>{
            this.setShowModalDeposit(false);
            this.toast(hash)
            this.setState({
                amount:""
            })
        }).catch(err=>{
            this.toast(err)
        })

    }

    getBalance = ()=>{
        const {account} = this.state;
        let balance:any = account && account.Balance;
        if(balance && !(balance instanceof Map)){
            const keys = Object.keys(balance);
            const tmp:Map<string,string> = new Map();
            for(let key of keys){
                tmp.set(key,balance[key])
            }
            balance = tmp;
        }
        return balance;
    }

    toast = (msg:any)=>{
        this.setState({
            toastMsg:msg,
            showToast:true
        })
    }

    setShowToast = (f:boolean)=> {
        this.setState({
            showToast:f
        })
    }

    setShowAlert = (f:boolean) =>{
        this.setState({
            showAlert:f
        })
    }

    setShowAlertExchange = (f:boolean) =>{
        const {radio} = this.state;
        this.setState({
            showAlertExchange:f
        })
        if(!!f){
            setTimeout(function () {
                const obj = document.getElementById("amountId");
                if(obj){
                    obj.oninput = function (e:any) {
                        const aspan = document.getElementById("amountExchange");
                        if(aspan){
                            if( e.target.value){
                                aspan.innerText="Expect: "+new BigNumber(e.target.value).multipliedBy(radio[0]).dividedBy(radio[1]).toFixed(4,1)
                            }else{
                                aspan.innerText="Expect: 0.000";
                            }
                        }
                    }
                }

            },100)
        }
    }

    withdraw(){

        const {detail,account,amountWithdraw,selectedCoin} = this.state;

        const amount = toValue(amountWithdraw);

        if(amount.comparedTo(0)<=0){
            this.toast(i18n.t("withdrawMore"))
            return
        }
        if(new BigNumber(amountWithdraw).comparedTo(detail?detail.canDrawupPoints:0)>0){
            this.toast(i18n.t("lessBalance"))
            return
        }

        contract.withdraw(account,amount,selectedCoin === "SERO").then((hash:any)=>{
            this.toast(hash)
            this.setShowModalWithdraw(false)
            this.setState({
                amountWithdraw:""
            })
        }).catch((e)=>{
            this.toast(e)
        })

    }

    setSelectedCoin = (f:boolean) =>{
        this.setState({
            selectedCoin:f
        })
    }

    setShowModalDetail = (f:boolean) =>{
        this.setState({
            showModalDetail:f
        })
    }

    takeVipReward = ()=>{
        contract.takeVipReward(this.state.account).then(hash=>{
            this.toast(hash)
        }).catch(e =>{
           this.toast(e)
        })
    }

    runLottery = ()=>{
        contract.runALottery(this.state.account).then(hash=>{
            this.toast(hash)
            this.setShowModalDetail(false)
        }).catch(e =>{
            this.toast(e)
        })
    }

    investProxy = () =>{
        // @ts-ignore
        const address:string = this.props.match.params.address;

        const {amountProxy,account,selectedProxyCoin,radio} = this.state;
        if(!amountProxy){
            this.toast(i18n.t("inputAmount"))
            return
        }
        const balance = this.getBalance();
        if(address){
            if(account && balance && balance.has(selectedProxyCoin)){
                if(new BigNumber(amountProxy).comparedTo(balance.get(selectedProxyCoin))>=0){
                    this.toast(i18n.t("lessBalance"))
                    return
                }
            }else{
                this.toast(i18n.t("lessBalance"))
                return
            }
            const amt = selectedProxyCoin===coink?new BigNumber(amountProxy).multipliedBy(8).dividedBy(100):new BigNumber(amountProxy).multipliedBy(new BigNumber(radio[1])).multipliedBy(8).dividedBy(100).dividedBy(new BigNumber(radio[0]));
            contract.investProxy(account,address,toValue(amt.toFixed(18)),selectedProxyCoin,toValue(amt.toFixed(18))).then(hash=>{
                this.toast(hash)
                this.setShowModalProxy(false)
                // setTimeout(()=>{
                //     window.location.href="/"
                // },1500)
                this.setState({
                    amountProxy:""
                })
            }).catch(e =>{
                this.toast(e)
            })
        }else{
            this.toast("Invalid Address")
        }
    }

    setSelectedProxyCoin = (v:any) =>{
        this.setState({
            selectedProxyCoin:v
        })
    }

    setCode = (v:any)=>{
        this.setState({
            code:v
        })
    }

    calAmount = (toCy:string,amount:any):any =>{
        const {radio} = this.state;
        if(!amount){ amount = 0}
        if(toCy === "SERO"){
            return new BigNumber(amount).multipliedBy(new BigNumber(radio[1])).dividedBy(new BigNumber(radio[0])).toString(10)
        }else if(toCy === coink){
            return new BigNumber(amount).multipliedBy(new BigNumber(radio[0])).dividedBy(new BigNumber(radio[1])).toString(10)
        }
        return amount;
    }

    copyTx(){
        // const {detail} = this.state;
        if(myCode){
            // alert(myCode);
            // alert(typeof myCode);
            copy(myCode,{debug:true,message:"copy success",onCopy:(e:any)=>{
                console.log("copy=",e);
                }});
            this.toast(i18n.t("copySuccess"))
        }
    }

    thaw = (v:any)=>{
        if(!v){
            this.toast(i18n.t("inputAmount"))
            return;
        }
        const {account} = this.state;
        contract.thaw(account,toValue(v)).then((hash:any)=>{
            this.toast(hash);
            this.setShowAlert(false);
        }).catch(err=>{
            this.toast(err)
        })
    }

    exchangePoint = (v:any)=>{
        const balance = this.getBalance();
        if(!v){
            this.toast(i18n.t("inputAmount"))
            return;
        }
        if(balance && toValue(v).comparedTo(balance.get("SERO")) == 1){
            this.toast(i18n.t("lessBalance"))
            return;
        }
        const {account} = this.state;
        contract.getPoint(account,toValue(v)).then((hash:any)=>{
            this.toast(hash);
            this.setShowAlertExchange(false);
        }).catch(err=>{
            this.toast(err)
        })
    }
    render(): React.ReactNode {
        const {account,accounts,showPopover,showModal,showModalDeposit,detail,winnersInfo,
            checkAccount,checkAccountPoints,code,amount,showToast,toastMsg,showModalProxy,showModalWithdraw,
            selectedCoin,amountWithdraw,showModalDetail,checkAccountSUSD,radio,amountProxy,selectedProxyCoin,showAlert,showAlertExchange} = this.state;


        // const lessNow = new BigNumber(winnersInfo && winnersInfo.drawTimeStamp).comparedTo(now)<0;

        let b = nextShareTime();


        let showButton = winnersInfo && winnersInfo.drawTimeStamp!=="0"?
            !(winnersInfo.topSixRewards && winnersInfo.topSixRewards.length > 0&&new Date(parseInt(winnersInfo.drawTimeStamp)*1000).getUTCDate() === new Date().getUTCDate())
            :
            true;

        //10 minutes
        // let showButton = false;
        //
        // const now = Math.ceil(new Date().getTime());
        // let a:any = winnersInfo && winnersInfo.drawTimeStamp!="0"?new Date(parseInt(winnersInfo.drawTimeStamp)*1000):"";
        //
        // if(a){
        //     b = a.getTime() + ((Math.ceil(a.getMinutes()/10+0.1)-a.getMinutes()/10)*10*60-a.getSeconds())*1000;
        //
        //     showButton = !!(winnersInfo && winnersInfo.topSixRewards && winnersInfo.topSixRewards.length > 0);
        //     if(showButton){
        //         if(now>b){
        //             a = new Date()
        //             b = a.getTime() + ((Math.ceil(a.getMinutes()/10+0.1)-a.getMinutes()/10)*10*60-a.getSeconds())*1000;
        //         }else{
        //             showButton = false;
        //         }
        //     }else{
        //         if(now>b){
        //             a = new Date()
        //             b = a.getTime() + ((Math.ceil(a.getMinutes()/10+0.1)-a.getMinutes()/10)*10*60-a.getSeconds())*1000;
        //         }
        //     }
        // }

        // const countdown = lessNow?(winnersInfo && winnersInfo.drawTimeStamp ? parseInt(winnersInfo.drawTimeStamp) + 10 * 60:now):now

        const balance:Map<string,string> = this.getBalance();

        const starNum:any = detail ?detail.star:0

        let starHtm:Array<any> = [];
        for(let i=0;i<starNum;i++){
            starHtm.push(<IonIcon icon={star} color="warning"  style={{fontSize:"24px"}}/>)
        }
        for(let i=6;i>starNum;i--){
            starHtm.push(<IonIcon icon={starOutline} style={{fontSize:"24px"}}/>)
        }

        let showRadio = <>1SERO = {new BigNumber(radio[0]).dividedBy(radio[1]).toFixed(4,1)} {coink}</>

        return (
            <IonPage>
                <IonContent>
                    <div className="container" >
                        <div style={{height:"360px"}}>
                            <div className="pure_top">
                                <div className="title">
                                    <IonItem className="account" lines="none" >
                                        <IonAvatar slot="start">
                                            <Avatar options={options} hash={account.MainPKr} className="avatar-bk"/>
                                        </IonAvatar>
                                        <IonLabel>
                                            {account.Name}<br/>
                                            <span>{ellipsisAddress(account.MainPKr)}</span><br/>
                                            <span>
                                                {starHtm}
                                            </span>
                                        </IonLabel>
                                        <IonPopover
                                            isOpen={showPopover}
                                            cssClass='my-custom-class'
                                            onDidDismiss={e => this.setShowPopover(false)}
                                        >
                                            <IonList inset={true}>
                                                {
                                                    accounts.map(value => {
                                                        return <IonItem
                                                            onClick={()=>this.setAccount(value)}
                                                        >{ellipsisAddress(value.Name)}(<small>{ellipsisAddress(value.MainPKr)}</small>)</IonItem>
                                                    })
                                                }
                                            </IonList>
                                        </IonPopover>
                                        {detail && detail.isVip?<IonIcon icon={vip} size={"large"} color="warning" className="avatar-bk"/>:""}
                                        <IonButton mode="ios" fill="outline" color="dark" onClick={()=>this.setShowPopover(true)}>{i18n.t("switch")}</IonButton>
                                    </IonItem>
                                </div>

                            </div>
                            <div className="qrbox">
                                <div className="qr-title">
                                    <div className="icon">
                                        <div className="b"></div>
                                        <div className="h"></div>
                                        <div className="s"></div>
                                        <div className="z"></div>
                                    </div>
                                    <div className="receive-text">{i18n.t("receiveCode")}</div>
                                </div>
                                <div className="qrcode-box">
                                    <canvas id="canvas" className="qrcode"></canvas>
                                </div>
                            </div>


                        </div>

                        <div style={{padding:"16px"}}>
                            <IonItemDivider mode="ios">
                                <IonText color="dark">{i18n.t("myWallet")}</IonText>
                                {/*<IonIcon icon={walletOutline} style={{color:"#fad579"}} slot="start"/>*/}
                            </IonItemDivider>
                            <IonList style={{margin:"0 0 16px 0"}} className="border-content">

                                <IonItem mode="ios" lines="none">
                                    <IonLabel><span className="text-small">SERO</span><br/></IonLabel>
                                    <IonBadge color="tertiary">{balance?fromValue(balance.get("SERO")).toFixed(4,1):"0.000"}</IonBadge>
                                </IonItem>

                                <IonItem mode="ios" lines="none">
                                    <IonLabel><span className="text-small">{coink} </span><br/></IonLabel>
                                    <IonBadge color="tertiary">{balance?fromValue(balance.get(coink)).toFixed(4,1):"0.000"}</IonBadge>
                                    <IonButton mode="ios" size="small" fill="outline" color="dark" onClick={()=>this.setShowAlertExchange(true)}>{i18n.t("exchange")}</IonButton>
                                </IonItem>

                                {/*<IonItem mode="ios" lines="none">*/}
                                {/*    <IonIcon icon={walletOutline} style={{color:"#fad579"}} slot="start">*/}
                                {/*    </IonIcon>*/}
                                {/*    <IonLabel><span className="text-small">SUSD</span><br/></IonLabel>*/}
                                {/*    <IonText color="medium">{balance?fromValue(balance.get("SUSD")).toFixed(3):"0.000"}</IonText>*/}
                                {/*</IonItem>*/}
                            </IonList>

                            <IonItemDivider mode="ios">
                                {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonText color="dark">{i18n.t("point")}({coink})</IonText>
                            </IonItemDivider>
                            <IonList style={{marginBottom:"16px"}} className="border-content">
                                <IonItem  mode="ios" lines="none">

                                    <IonLabel><span className="text-small">{i18n.t("balance")}</span></IonLabel>
                                    <IonBadge color="tertiary">{detail && detail.points.toFixed(4,1)}</IonBadge>
                                    <IonButton mode="ios" size="small" fill="outline" color="dark" onClick={()=>this.setShowModalDeposit(true)}>{i18n.t("deposit")}</IonButton>
                                </IonItem>
                                <IonItem  mode="ios" lines="none">
                                    <IonLabel><span className="text-small">{i18n.t("withdrawAble")}</span></IonLabel>
                                    <IonBadge color="tertiary">{detail && detail.canDrawupPoints.toFixed(4,1)}</IonBadge>
                                    <IonButton mode="ios" size="small" fill="outline" color="danger" onClick={()=>this.setShowModalWithdraw(true)}>{i18n.t("withdraw")}</IonButton>
                                </IonItem>
                                {
                                    detail && detail.frozenPoints && detail.frozenPoints.comparedTo(0) == 1?<IonItem  mode="ios" lines="none">
                                    <IonLabel><span className="text-small">{i18n.t("frozen")}</span></IonLabel>
                                        <IonBadge color="tertiary">{detail && detail.frozenPoints.toFixed(4,1)}</IonBadge>
                                        <IonBadge color="success">{i18n.t("returned")}</IonBadge>
                                    <IonButton mode="ios" size="small" fill="outline" color="danger" onClick={()=>this.setShowAlert(true)}>{i18n.t("release")}</IonButton>
                                    </IonItem>:""
                                }

                                <IonButton mode="ios"expand="block" size="small" color="dark" onClick={()=>this.setShowModal(true)}>{i18n.t("more")}</IonButton>
                            </IonList>

                            {/*<IonList style={{margin:"16px 0px",borderRadius:"5px"}} className="border-content">*/}
                            {/*    <div className="text-center">*/}
                            {/*        <p>全球分红</p>*/}
                            {/*        <span style={{fontSize:"24px",fontWeight:800,color:"#fd5e48"}}>{winnersInfo && fromValue(winnersInfo.shareRewardPool).multipliedBy(2).toFixed(3,1)} <small>SERO</small></span>*/}
                            {/*        <div style={{paddingBottom:"10px"}}>*/}
                            {/*            <img src="./assets/img/box.png" width="50%"/>*/}
                            {/*        </div>*/}
                            {/*        <p className="text-small">今日分红：<span style={{color:"#fd5e48"}}>{winnersInfo && fromValue(winnersInfo.vipReward).toFixed(3,1)} SERO</span></p>*/}

                            {/*        {*/}
                            {/*            winnersInfo && fromValue(winnersInfo.vipReward).comparedTo(0)>0?*/}
                            {/*                <IonButton onClick={()=>this.takeVipReward()}>领取分红</IonButton>:""*/}
                            {/*        }*/}
                            {/*    </div>*/}
                            {/*</IonList>*/}

                            <IonList style={{margin:"16px 0px",borderRadius:"5px"}} className="border-content">
                                <div className="text-center">
                                    <p>{i18n.t("rewardPool")}</p>
                                    <div className="countdown"><Countdown date={b} /></div>
                                    <div style={{paddingBottom:"10px"}}>
                                        <img src="./assets/img/box.png" width="50%"/>
                                    </div>
                                    <IonItemDivider  mode="ios">{i18n.t("rewardGlobal")}</IonItemDivider>
                                    <IonItem  mode="ios" lines="none">
                                        {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                        <IonLabel><span className="text-small">{i18n.t("rewardPool")}</span></IonLabel>
                                        <IonBadge color="danger">
                                            {winnersInfo && fromValue(winnersInfo.shareRewardPool).multipliedBy(2).toFixed(4,1)} SERO
                                        </IonBadge>
                                    </IonItem>
                                    <IonItem  mode="ios" lines="none">
                                        {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                        <IonLabel><span className="text-small">{i18n.t("todayReward")}</span></IonLabel>
                                        <IonBadge color="danger">
                                            {winnersInfo && fromValue(winnersInfo.vipReward).toFixed(4,1)} SERO
                                        </IonBadge>
                                        {
                                            winnersInfo && fromValue(winnersInfo.vipReward).comparedTo(0)>0?
                                                <IonButton onClick={()=>this.takeVipReward()}>{i18n.t("getReward")}</IonButton>:""
                                        }
                                    </IonItem>

                                    <IonItemDivider mode="ios">{i18n.t("dayAuction")}</IonItemDivider>
                                    <IonItem  mode="ios" lines="none">
                                        {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                        <IonLabel><span className="text-small">{i18n.t("rewardPool")}</span></IonLabel>
                                        <IonBadge color="danger">
                                            {winnersInfo && fromValue(winnersInfo.nowShareRewardPool).toFixed(4,1)} SERO
                                        </IonBadge>
                                    </IonItem>
                                    <IonItem  mode="ios" lines="none">
                                        {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                        <IonLabel><span className="text-small">{i18n.t("todayReward")}</span></IonLabel>
                                        <IonBadge color="danger" className="text-small">
                                            {detail && detail.code && winnersInfo && winnersInfo.topSixCodes.indexOf(detail.code)>-1?fromValue(winnersInfo.topSixRewards[winnersInfo.topSixCodes.indexOf(detail.code)]).toFixed(4,1):i18n.t("notTheTop")}
                                        </IonBadge>
                                        {
                                            winnersInfo && fromValue(winnersInfo.vipReward).comparedTo(0)>0?
                                                <IonButton onClick={()=>this.takeVipReward()}>{i18n.t("getRewark")}</IonButton>:""
                                        }
                                    </IonItem>
                                    <IonButton mode="ios" size="small" onClick={()=>{this.setShowModalDetail(true)}} color="dark" expand="block">{i18n.t("detail")}</IonButton>
                                </div>

                            </IonList>

                            <IonList style={{margin:"16px 0px",borderRadius:"5px"}} className="border-content">
                                <IonItem  mode="ios">
                                    <IonLabel ><IonText className="text-small">{i18n.t("source")}</IonText></IonLabel>
                                    <IonText style={{wordBreak:"break-all",width:"70%"}}><small><a href={i18n.t("sourceUrl")}>{i18n.t("sourceText")}</a></small></IonText>
                                </IonItem>

                                <IonItem  mode="ios" lines="none">
                                    <IonLabel><IonText className="text-small">{i18n.t("telegram")}</IonText></IonLabel>
                                    <IonText><a href="https://0.plus/Sero_CoinHi" className="text-small">Sero_CoinHi</a></IonText>
                                </IonItem>
                            </IonList>

                        </div>

                    </div>


                    <IonModal isOpen={showModal}
                              onDidDismiss={() => this.setShowModal(false)}
                              cssClass='my-custom-class'
                              >
                        <IonList>

                            {/*(points + frozenPoints + returnPoints)/12.5-recommendProfit - starProfit*/}

                            <IonItemDivider mode="ios">{i18n.t("myInfo")}</IonItemDivider>
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={rocketOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("myCode")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.code}</IonBadge>
                                {detail && detail.code?<IonIcon icon={copyOutline} size="small" color="medium"  onClick={()=>{
                                    copy(detail.code);
                                    copy(detail.code);
                                    this.toast(i18n.t("copySuccess"))}}/>:""}
                            </IonItem>
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={rocketOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("referCode")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.refereeCode}</IonBadge>
                            </IonItem>
                            {/*<IonItem  mode="ios">*/}
                            {/*    /!*<IonIcon icon={rocketOutline} style={{color:"#fad579"}} slot="start"/>*!/*/}
                            {/*    <IonLabel><span className="text-small">我的本金</span></IonLabel>*/}
                            {/*    <IonBadge className="text-small" color="medium">{detail && detail.points.plus(detail.frozenPoints).plus(detail.returnPoints).dividedBy(12.5).minus(detail.recommendProfit).minus(detail.starProfit).toFixed(3,1)} {coink}</IonBadge>*/}
                            {/*</IonItem>*/}
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={rocketOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("alreadyWithdraw")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.returnPoints.minus(detail.canDrawupPoints).toFixed(4,1)} {coink}</IonBadge>
                            </IonItem>
                            {/*<IonItem  mode="ios" lines="none" onClick={()=>{this.copyTx(detail && detail.largeAreaCode)}}>*/}
                            {/*    <IonIcon icon={rocketOutline} style={{color:"#fad579"}} slot="start"/>*/}
                            {/*    <IonLabel><span className="text-small">大区充值码</span></IonLabel>*/}
                            {/*    <IonText className="text-small" color="medium">{detail && detail.largeAreaCode}</IonText>*/}
                            {/*    {detail && detail.largeAreaCode?<IonIcon icon={copyOutline} size="small" color="medium"/>:""}*/}
                            {/*</IonItem>*/}

                            <IonItemDivider mode="ios">{i18n.t("reward")}</IonItemDivider>
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("largeArea")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.largeAchievement.toFixed(4,1)}</IonBadge>
                            </IonItem>
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("smallArea")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.achievement.minus(detail.largeAchievement).toFixed(4,1)}</IonBadge>
                            </IonItem>
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("referReward")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.recommendProfit.toFixed(4,1)}</IonBadge>
                            </IonItem>
                            <IonItem  mode="ios">
                                {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("manageReward")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.starProfit.toFixed(4,1)}</IonBadge>
                            </IonItem>

                            <IonItem  mode="ios" lines="none">
                                {/*<IonIcon icon={serverOutline} style={{color:"#fad579"}} slot="start"/>*/}
                                <IonLabel><span className="text-small">{i18n.t("dayIncome")}</span></IonLabel>
                                <IonBadge className="text-small" color="medium">{detail && detail.dayIncome.toFixed(4,1)}</IonBadge>
                            </IonItem>

                            <IonItemDivider mode="ios">{i18n.t("contractAddress")}</IonItemDivider>
                            <IonItem  mode="ios">
                                <IonText style={{wordBreak:"break-all",width:"100%"}}  onClick={()=>{copy(contract.contract.address);this.toast(i18n.t("copySuccess"))}}><small>{contract.contract.address}</small> <IonIcon icon={copyOutline}/></IonText>
                            </IonItem>

                        </IonList>
                        <IonButton mode="ios" onClick={() => this.setShowModal(false)}>关闭</IonButton>
                    </IonModal>

                    <IonModal isOpen={showModalDeposit}
                              onDidDismiss={() => this.setShowModalDeposit(false)}
                    >
                        <IonList>
                            <IonItemDivider mode="ios">{i18n.t("ratio")}</IonItemDivider>
                            <IonItem mode="ios" lines="none">
                                {/*<IonLabel><span className="text-small">比例</span><br/></IonLabel>*/}
                                <IonText color="dark" className="text-small">
                                    {showRadio}
                                </IonText>
                            </IonItem>
                            {/*<IonItem mode="ios" lines="none">*/}
                            {/*    <IonLabel><span className="text-small">SUSD:{coink}</span><br/></IonLabel>*/}
                            {/*    <IonText color="primary" className="text-small">1:1</IonText>*/}
                            {/*</IonItem>*/}

                            <IonItemDivider mode="ios">{i18n.t("depositType")}</IonItemDivider>
                            <IonItem mode="ios">
                                <IonCheckbox slot="start" color="primary" checked={checkAccount} onClick={(e)=>this.setChecked(true,false)}/>
                                <IonLabel><span className="text-small">SERO</span><br/></IonLabel>
                                <IonBadge color="tertiary">{balance?fromValue(balance.get("SERO")).toFixed(4,1):"0.000"}</IonBadge>
                            </IonItem>
                            {/*<IonItem mode="ios">*/}
                            {/*    <IonCheckbox slot="start" color="primary" checked={checkAccountSUSD} onClick={(e)=>this.setChecked(false,true,false)}/>*/}
                            {/*    <IonLabel><span className="text-small">SUSD</span><br/></IonLabel>*/}
                            {/*    <IonText color="medium">{balance?fromValue(balance.get("SUSD")).toFixed(3):"0.000"}</IonText>*/}
                            {/*</IonItem>*/}

                            <IonItem  mode="ios">
                                <IonCheckbox slot="start" color="primary" checked={checkAccountPoints} onClick={(e)=>this.setChecked(false,true)}/>
                                <IonLabel><span className="text-small">{coink}</span></IonLabel>
                                <IonBadge color="tertiary">{balance?fromValue(balance.get(coink)).toFixed(4,1):"0.000"}</IonBadge>
                            </IonItem>

                            <IonItemDivider mode="ios">{i18n.t("depositInfo")}</IonItemDivider>
                            <IonItem  mode="ios">
                                <IonLabel position="stacked">{i18n.t("depositCode")}</IonLabel>
                                <IonInput color="medium" mode="ios" placeholder={i18n.t("referCode")} value={detail&&detail.refereeCode?detail.refereeCode:code} readonly={detail&&detail.refereeCode?true:false} onIonChange={(e)=>this.setCode(e.detail.value)} />
                            </IonItem>
                            <IonItem  mode="ios">
                                <IonLabel  position="stacked">{i18n.t("amount")}({checkAccount?"SERO":checkAccountSUSD?"SUSD":coink})</IonLabel>
                                <IonInput color="dark" mode="ios" placeholder={i18n.t("inputAmount")} autofocus={true} value={amount} clearInput={true} onIonChange={(e:any)=>this.setAmount(e.detail.value!)}
                                          clearOnEdit={true} inputmode={"decimal"} min={"0"} required={true} type="number" />
                            </IonItem>

                            <IonItem  mode="ios" lines="none">
                                <IonLabel  position="stacked">{i18n.t("expectDeposit")}({coink})</IonLabel>
                                <IonInput color="dark" mode="ios" autofocus={true} value={checkAccount?this.calAmount(coink,amount):amount} readonly/>
                            </IonItem>

                            <IonRow style={{marginTop:"24px"}}>
                                <IonCol size="4">
                                    <IonButton mode="ios" onClick={() => this.setShowModalDeposit(false)} expand="block" fill="outline" color="danger">{i18n.t("cancel")}</IonButton>
                                </IonCol>
                                <IonCol size="8">
                                    <IonButton mode="ios" color="tertiary" onClick={() => this.confirm()} expand="block">{i18n.t("ok")}</IonButton>
                                </IonCol>
                            </IonRow>

                        </IonList>
                    </IonModal>

                    <IonModal isOpen={showModalProxy}
                              onDidDismiss={() => this.setShowModalProxy(false)}
                    >
                        <IonList>
                            <IonItem mode="ios">
                                <IonLabel><span className="text-small">{i18n.t("address")}</span><br/></IonLabel>
                                <IonText color="medium" className="proxy-customer">{
                                    // @ts-ignore
                                    this.props.match.params.address
                                }</IonText>
                            </IonItem>

                            <IonItem mode="ios">
                                <IonLabel><span className="text-small">{i18n.t("selectAccount")}</span><br/></IonLabel>
                                <IonText color="medium" onClick={()=>this.setShowPopover(true)}>{account.Name}({ellipsisAddress(account.MainPKr)})</IonText>
                                <IonIcon icon={chevronForward} color={"medium"}></IonIcon>
                            </IonItem>

                            <IonRadioGroup value={selectedProxyCoin} onIonChange={e => this.setSelectedProxyCoin(e.detail.value)}>
                                <IonItemDivider mode="ios">{i18n.t("selectCoin")}</IonItemDivider>
                                <IonItem  mode="ios">
                                    <IonLabel>{"SERO"}</IonLabel>
                                    <IonRadio slot="start" mode="ios" value="SERO" defaultChecked/>
                                    <IonBadge color="tertiary">{balance?fromValue(balance.get("SERO")).toFixed(4,1):"0.000"}</IonBadge>
                                </IonItem>

                                {/*<IonItem  mode="ios">*/}
                                {/*    <IonLabel>SUSD</IonLabel>*/}
                                {/*    <IonRadio slot="start" value="SUSD" />*/}
                                {/*    <IonText color="medium">{balance?fromValue(balance.get("SUSD")).toFixed(3):"0.000"}</IonText>*/}
                                {/*</IonItem>*/}

                                <IonItem  mode="ios">
                                    <IonLabel>{coink}</IonLabel>
                                    <IonRadio slot="start" mode="ios" value={coink} />
                                    <IonBadge color="tertiary">{balance?fromValue(balance.get(coink)).toFixed(4,1):"0.000"}</IonBadge>
                                </IonItem>
                            </IonRadioGroup>

                            <IonItem  mode="ios">
                                <IonLabel  position="stacked">{i18n.t("amountSale")}</IonLabel>
                                <IonInput color="dark" mode="ios" placeholder={i18n.t("inputAmountSale")} value={amountProxy} clearInput={true} onIonChange={(e:any)=>this.setAmountProxy(e.detail.value!)} clearOnEdit={true} inputmode={"decimal"} min={"0"} required={true} type="number"/>
                            </IonItem>

                            <IonItem  mode="ios">
                                <IonLabel  position="stacked">{i18n.t("amount")}({selectedProxyCoin})</IonLabel>
                                <IonText>{selectedProxyCoin===coink?new BigNumber(amountProxy?amountProxy:"0").multipliedBy(8).dividedBy(100).toString(10):new BigNumber(amountProxy?amountProxy:"0").multipliedBy(new BigNumber(radio[1])).multipliedBy(8).dividedBy(100).dividedBy(new BigNumber(radio[0])).toString(10)}</IonText>
                            </IonItem>


                            <IonRow>
                                <IonCol size="4">
                                    <IonButton mode="ios" onClick={() => {
                                        this.setShowModalProxy(false);
                                        // window.location.href="/"
                                    }} expand="block" fill="outline" color="danger">{i18n.t("cancel")}</IonButton>
                                </IonCol>
                                <IonCol size="8">
                                    <IonButton mode="ios" color="tertiary"  onClick={() => this.investProxy()} expand="block">{i18n.t("ok")}</IonButton>
                                </IonCol>
                            </IonRow>

                        </IonList>
                    </IonModal>


                    <IonModal isOpen={showModalWithdraw}
                              onDidDismiss={() => this.setShowModalWithdraw(false)}
                    >

                        <IonList>
                            <IonItemDivider mode="ios">{i18n.t("ratio")}</IonItemDivider>
                            <IonItem mode="ios">
                                <IonText color="dark" className="text-small">
                                    {showRadio}
                                </IonText>
                            </IonItem>

                            <IonItem mode="ios">
                                <IonLabel><span className="text-small">{i18n.t("canWithdraw")}{coink}</span><br/></IonLabel>
                                <IonBadge color="tertiary">
                                    {detail && detail.canDrawupPoints.toFixed(4,1)}
                                </IonBadge>
                            </IonItem>

                            <IonRadioGroup value={selectedCoin} onIonChange={e => this.setSelectedCoin(e.detail.value)}>
                                <IonItemDivider mode="ios">{i18n.t("selectCoin")}</IonItemDivider>
                                <IonItem  mode="ios">
                                    <IonLabel>{coink}</IonLabel>
                                    <IonRadio slot="start" value={coink} defaultChecked/>
                                </IonItem>

                                <IonItem  mode="ios">
                                    <IonLabel>SERO</IonLabel>
                                    <IonRadio slot="start" value="SERO" />
                                </IonItem>
                            </IonRadioGroup>


                            <IonItemDivider mode="ios">{i18n.t("inputWithdrawAmount")}</IonItemDivider>
                            <IonItem  mode="ios">
                                <IonLabel  position="stacked">{i18n.t("amount")}({coink})</IonLabel>
                                <IonInput color="dark" mode="ios" value={amountWithdraw} clearInput={true} onIonChange={(e:any)=>this.setAmountWithdraw(e.detail.value!)}
                                          clearOnEdit={true}  placeholder={i18n.t("inputWithdrawAmount")} inputmode={"decimal"} min={"0"} required={true} type="number"/>
                            </IonItem>

                            <IonItem  mode="ios" lines="none">
                                <IonLabel  position="stacked">{i18n.t("expectWithdraw")}({selectedCoin})</IonLabel>
                                <IonInput color="dark" mode="ios" defaultValue="0" autofocus={true} value={selectedCoin === "SERO"?this.calAmount(selectedCoin,amountWithdraw):amountWithdraw} readonly/>
                            </IonItem>

                            <IonRow>
                                <IonCol size="4">
                                    <IonButton mode="ios" onClick={() => this.setShowModalWithdraw(false)} expand="block" fill="outline" color="danger">{i18n.t("cancel")}</IonButton>
                                </IonCol>
                                <IonCol size="8">
                                    <IonButton mode="ios" color="tertiary" onClick={() => this.withdraw()} expand="block">{i18n.t("ok")}</IonButton>
                                </IonCol>
                            </IonRow>

                        </IonList>
                    </IonModal>

                    <IonModal isOpen={showModalDetail}
                              onDidDismiss={() => this.setShowModalDetail(false)}
                    >

                        <IonList className="text-center">

                            <IonItemDivider mode="ios">{i18n.t("auctionRule")}</IonItemDivider>
                            <IonRow>
                                <IonCol size="12" style={{textAlign:'left'}}>
                                    <pre>
                                        <IonText color="dark" className="text-small">
                                            {i18n.t("ruleInfo")} {winnersInfo && winnersInfo.drawTimeStamp!=="0"? formatDate(new BigNumber(winnersInfo.drawTimeStamp).multipliedBy(1000).toNumber()):""}<br/>
                                        </IonText>
                                    </pre>
                                </IonCol>
                            </IonRow>


                            <IonItemDivider mode="ios" style={{marginTop:"24px"}}>{i18n.t("lastAuction")}</IonItemDivider>
                            <IonRow>
                                <IonCol size="4"><IonText color="dark" className="text-small">{i18n.t("depositCode")}</IonText></IonCol>
                                <IonCol size="4"><IonText color="dark" className="text-small">{i18n.t("reward")}(SERO)</IonText></IonCol>
                                <IonCol size="4"><IonText color="dark" className="text-small">{i18n.t("rewardValue")}</IonText></IonCol>
                            </IonRow>

                            {
                                winnersInfo&& winnersInfo.winnerCodes.map(((v,i)=>{
                                    return <IonRow>
                                        <IonCol size="4" className="text-small"><IonText color="dark" className="text-small">{v.slice(0,3)+"..."+v.slice(v.length-3)}</IonText></IonCol>
                                        <IonCol size="4" className="text-small"><IonText color="dark" className="text-small">{fromValue(winnersInfo.winnerRewards[i]).toFixed(4,1)}</IonText></IonCol>
                                        <IonCol size="4" className="text-small"><IonText color="dark" className="text-small">{fromValue(winnersInfo.winnerShareValues[i]).toFixed(4,1)}</IonText></IonCol>
                                    </IonRow>
                                }))
                            }

                            <IonItemDivider mode="ios" style={{marginTop:"24px"}}>{i18n.t("currentAuction")}</IonItemDivider>
                            <IonRow>
                                <IonCol size="4"><IonText color="dark" className="text-small">{i18n.t("depositCode")}</IonText></IonCol>
                                <IonCol size="4"><IonText color="dark" className="text-small">{i18n.t("reward")}(SERO)</IonText></IonCol>
                                <IonCol size="4"><IonText color="dark" className="text-small">{i18n.t("rewardValue")}</IonText></IonCol>
                            </IonRow>

                            {
                                winnersInfo&& winnersInfo.topSixCodes.map(((v,i)=>{
                                    return <IonRow>
                                        <IonCol size="4" className="text-small"><IonText color="dark" className="text-small">{v.slice(0,3)+"..."+v.slice(v.length-3)}</IonText></IonCol>
                                        <IonCol size="4" className="text-small"><IonText color="dark" className="text-small">{fromValue(winnersInfo.topSixRewards[i]).toFixed(4,1)}</IonText></IonCol>
                                        <IonCol size="4" className="text-small"><IonText color="dark" className="text-small">{fromValue(winnersInfo.topSixShareValues[i]).toFixed(4,1)}</IonText></IonCol>
                                    </IonRow>
                                }))
                            }

                            <IonRow style={{marginTop:"24px"}}>
                                <IonCol size="4">
                                    <IonButton mode="ios" onClick={() => this.setShowModalDetail(false)} expand="block" fill="outline" color="danger">{i18n.t("cancel")}</IonButton>
                                </IonCol>
                                <IonCol size="8">
                                    <IonButton mode="ios" onClick={() => this.runLottery()} expand="block" disabled={!showButton}>{!showButton?<div className="countdown">{formatDate(b)}</div>:i18n.t("getReward")}</IonButton>
                                </IonCol>
                            </IonRow>

                        </IonList>
                    </IonModal>

                    <IonAlert
                        isOpen={showAlert}
                        onDidDismiss={() => this.setShowAlert(false)}
                        header={i18n.t("frozen")}
                        mode="ios"
                        message={`<strong>${i18n.t("releaseRule")}${new BigNumber(radio[0]).multipliedBy(25).dividedBy(new BigNumber(radio[1])).toFixed(4,1)}个${coink}</strong>`}
                        inputs={[
                            {
                                name: 'amount',
                                type: 'number',
                                placeholder: 'SERO',
                                handler:(e:any)=>{
                                    // console.log("oninput>> ",e);
                                }
                            }
                        ]}
                        buttons={[
                            {
                                text: i18n.t("cancel"),
                                role: 'cancel',
                                cssClass: 'secondary',
                                handler: () => {
                                    console.log('Confirm Cancel');
                                }
                            },
                            {
                                text: i18n.t("ok"),
                                handler: (v:any) => {
                                    console.log('Confirm Ok',v);
                                    this.thaw(v["amount"]);
                                }
                            }
                        ]}
                    />

                    <IonAlert
                        isOpen={showAlertExchange}
                        onDidDismiss={() => this.setShowAlertExchange(false)}
                        header={i18n.t("exchange")}
                        message={`<span id="amountExchange">Expect: 0.000</span>`}
                        subHeader={`1SERO = ${new BigNumber(radio[0]).dividedBy(radio[1]).toFixed(4,1)} ${coink}`}
                        mode="ios"
                        inputs={[
                            {
                                name: 'amount',
                                id:"amountId",
                                type: 'number',
                                placeholder: 'SERO'
                            }
                        ]}
                        buttons={[
                            {
                                text: i18n.t("cancel"),
                                role: 'cancel',
                                cssClass: 'secondary',
                                handler: () => {
                                    console.log('Confirm Cancel');
                                }
                            },
                            {
                                text: i18n.t("ok"),
                                handler: (v:any) => {
                                    console.log('Confirm Ok',v);
                                    this.exchangePoint(v["amount"]);
                                }
                            }
                        ]}
                    />

                    <IonToast
                        isOpen={showToast}
                        onDidDismiss={() => this.setShowToast(false)}
                        message={toastMsg}
                        duration={1500}
                        position={"top"}
                        color={"dark"}
                    />

                </IonContent>
            </IonPage>
        );
    }
}


function nextShareTime() {
    let d = new Date();
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
    let year = d.getUTCFullYear();
    let month = d.getUTCMonth();
    let day = d.getUTCDate();
    d = new Date(year, month, day, 0, 0, 0);

    let tz = new Date().getTimezoneOffset() / 60;
    return d.getTime() + (-tz) * 60 * 60 * 1000;
}

export default Home;
