const fs = require("fs");
const xlsx = require('xlsx');
const { error } = require("console");
const axios = require('axios'); // HTTP 요청을 보내기 위한 라이브러리
const urlm = require('url')

//엑셀파일 불러오기1
        const workbook1 = xlsx.readFile(`C:/Users/USER/Desktop/실습데이터/KRX300_수정주가_실습.xlsx`);
        const sheetName = workbook1.SheetNames[0]; 
        const sheet = workbook1.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

//엑셀 파일 불러오기2
        const workbook2 = xlsx.readFile(`C:/Users/USER/Desktop/실습데이터/KRX300_FIN_DATA_2023.xlsx`);
        const findTs = xlsx.utils.sheet_to_json(workbook2.Sheets['재무']);


//지수이동 평균(EMA) 구하기 함수
function calculateEMA(dataArray, N) {
    let ema = dataArray[0];
    const smoothing = 2 / (N + 1);
    for (let i = 1; i < dataArray.length; i++) {
        ema = (dataArray[i] - ema) * smoothing + ema;
    }
    return ema;
}

//EMA(지수이동평균)를 이용해서 수정 주가를 예측하는 함수
function predictNextMonthPrice(dataArray, N) {
    const smoothing = 2 / (N + 1);
    let ema = calculateEMA(dataArray, N);
    const prediction = ema * (1 + smoothing);
    return prediction;
}

const page = {
    //루트 페이지
    home : (req, res)=>{
        var context = {}
        req.app.render('home', context , (err, html)=>{
            res.end(html)
        })
    },

    //수정 주가 예측 페이지
    modified_stock_price : (req, res)=>{
        var url = req.url
        var queryData= urlm.parse(url, true).query
        

        if(data[3400][queryData.D1]==undefined){
            res.send(`<script>alert("해당 종목 데이터가 존재하지 않습니다");
                                    window.history.back()</script>`)
        }
        else{
            var dataArray = [
                data[3400][queryData.D1], data[3419][queryData.D1], data[3441][queryData.D1],data[3462][queryData.D1],
                data[3482][queryData.D1], data[3500][queryData.D1], data[3521][queryData.D1], data[3542][queryData.D1],
                data[3564][queryData.D1], data[3583][queryData.D1], data[3604][queryData.D1],data[3625][queryData.D1]
            ];

            // 1달 뒤의 수정 주가 예측
            const N = 12;
            const predictedPrice = predictNextMonthPrice(dataArray, N);
        
            var context = {
                data1: queryData.D1,
                data2: dataArray,
                predi: predictedPrice
            }
            req.app.render('modified_stock_price', context , (err, html)=>{
                res.end(html)
            })
        } 
    },

    ROA_ROE : (req, res)=>{
        var url = req.url;
        var queryData = urlm.parse(url, true).query;
        var companyNameToFind = queryData.D1;

        const ROAArray = [];
        const ROEArray = [];
        const 부채비율Array = [];

        // 데이터를 찾을 때 예외 처리
        let dataFound = false;
        for (var i = 0; i < findTs.length; i++) {
            if (findTs[i].Name === companyNameToFind && findTs[i].회계연도 > 2012) {
                const ROE = findTs[i].당기순이익 / findTs[i].총자본;
                const ROA = findTs[i].당기순이익 / findTs[i].총자산;
                const 부채비율 = findTs[i].총부채 / findTs[i].총자본;

                ROEArray.push(ROE);
                ROAArray.push(ROA);
                부채비율Array.push(부채비율);
                dataFound = true;
            }
        }

        if (!dataFound) {
            res.send(`<script>alert("해당 종목 데이터가 존재하지 않습니다"); window.history.back()</script>`);
        } else {
            var context = {
                data1: queryData.D1,
                ROEdata: ROEArray,
                ROAdata: ROAArray,
                부채비율pred: 부채비율Array
            }
            req.app.render('ROA_ROE', context, (err, html) => {
                res.end(html);
            });
        }
    },

    rank : (req, res)=>{

        const ROARank = [];
        const ROERank = [];
        const debtRank =[];
        const EPSRank =[];
        const BPSRank =[];
        const SPSRank =[];
        const CFPSRank =[];

        for (var i = 0; i < findTs.length; i++) {
            if (findTs[i].회계연도 == 2022) {
                const ROE = findTs[i].당기순이익 / findTs[i].총자본;
                const ROA = findTs[i].당기순이익 / findTs[i].총자산;
                const 부채비율 = findTs[i].총부채 / findTs[i].총자본;
                const EPS = findTs[i].EPS
                const BPS = findTs[i].BPS
                const SPS = findTs[i].SPS 
                const CFPS = findTs[i].CFPS



                ROARank.push([findTs[i].Name, ROA]); // ROA를 2차원 배열에 추가
                ROERank.push([findTs[i].Name, ROE]); // ROE를 2차원 배열에 추가
                debtRank.push([findTs[i].Name, 부채비율])
                EPSRank.push([findTs[i].Name, EPS])
                BPSRank.push([findTs[i].Name, BPS])
                SPSRank.push([findTs[i].Name, SPS])
                CFPSRank.push([findTs[i].Name, CFPS])
                
            }
        }

        ROARank.sort((a, b) => b[1] - a[1]); // ROA를 기준으로 내림차순 정렬
        ROERank.sort((a, b) => b[1] - a[1]); // ROE를 기준으로 내림차순 정렬
        debtRank.sort((a, b) => a[1] - b[1]); // 부채비율를 기준으로 오름차순 정렬
        EPSRank.sort((a, b) => b[1] - a[1]); // ROE를 기준으로 내림차순 정렬
        BPSRank.sort((a, b) => b[1] - a[1]); // ROE를 기준으로 내림차순 정렬
        SPSRank.sort((a, b) => b[1] - a[1]); // ROE를 기준으로 내림차순 정렬
        CFPSRank.sort((a, b) => b[1] - a[1]); // ROE를 기준으로 내림차순 정렬

        context= {
            ROARank: ROARank.slice(0, 10), // 상위 10개 항목
            ROERank: ROERank.slice(0, 10),
            debtRank: debtRank.slice(0, 10),
            EPSRank: EPSRank.slice(0, 10),
            BPSRank: BPSRank.slice(0, 10),
            SPSRank: SPSRank.slice(0, 10),
            CFPSRank: CFPSRank.slice(0, 10),
        }

        req.app.render('rank',context, (err, html) => {
            res.end(html);
        });
    },
    
}

module.exports = {page};