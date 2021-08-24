const axios = require("axios");
const cheerio = require("cheerio");
const async =  require("async");
const fs = require("fs");


const axiosCheerioWrapper = async (url) =>{
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    return $
}

const main = async () => {
    console.log("* Initiating process...");
    const allItemsUrl = [];
    const allItemsData = [];
    const urls = [
        "https://www.garbarino.com/productos/electrodomesticos/4191",
        "https://www.garbarino.com/productos/tecnologia/4190",
        "https://www.garbarino.com/productos/casayjardin/4189",
        "https://www.garbarino.com/productos/salud/4195",
        "https://www.garbarino.com/productos/bebes/4193",
        "https://www.garbarino.com/productos/herramientas/4861",
        "https://www.garbarino.com/productos/deportes/4192",
        "https://www.garbarino.com/productos/accesorios/4904",
        "https://www.garbarino.com/productos/mascategorias/4197",
    ]
    //urls.length = 1;
    await async.eachLimit(urls, 3, async (url) =>{
        const urls = await getAllItemUrls(url);
        allItemsUrl.push(...urls);
    })

    //allItemsUrl.length = 5;
    await async.eachLimit(allItemsUrl, 5, async (itemUrl) =>{
        const item = await getItemsData(itemUrl);
        allItemsData.push(item);
    });

    await fs.promises.writeFile("garbarino-items.json", JSON.stringify(allItemsData));
    console.log("* Process finished successfully");
    console.log(allItemsData);
}

main();



async function getAllItemUrls(url){
    console.log("* Getting All Urls for ", url);
    const allItems = []
    const $ = await axiosCheerioWrapper(url)
    const buttons = $(".pagination__page").toArray()
    const numberOfPages = $(buttons[buttons.length - 2]).text().trim();
    const createdUrls = createUrls(url, numberOfPages);
    
    allItems.push(...extractUrl($));

    await async.eachLimit(createdUrls, 10, async (pageUrl) =>{
        console.log("* Going to ", pageUrl);
        const $ = await axiosCheerioWrapper(url)
        let items = extractUrl($)
        allItems.push(...items);
    });
    
    console.log("* Got all urls for ", url);
    return allItems;
}

async function getItemsData(url){
    console.log("* Scrapping ", url);
    const itemData = {};
    const $ = await axiosCheerioWrapper(url)

    itemData.name = $(".title-product h1").text().trim();
    itemData.seller = $(".gb-main-detail-marketplace-logo").attr("src") ? "https:" + $(".gb-main-detail-marketplace-logo").attr("src") : "garbarino";
    itemData.id = url.split("/").pop();
    itemData.url = url;

    return itemData;
}





const extractUrl = ($) =>{
    const items = $(".itemBox--carousel a.main").toArray();

    return items.map(tag => {
        return "https://www.garbarino.com"+$(tag).attr("href");
    })
}

const createUrls = (url, numberOfPages) => {
    const createdUrl = [];
    numberOfPages = Number(numberOfPages)+1;
    for (let index = 2; index < numberOfPages; index++) {
        createdUrl.push(url+"?page="+index);
    }
    return createdUrl;
}
