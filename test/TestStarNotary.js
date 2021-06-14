const StarNotary = artifacts.require("StarNotary");
const truffleAssert = require("truffle-assertions");

const ContractName = "STAR_REGISTRY";
const ContractSymbol = "STR";

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let instance = await StarNotary.deployed();
    assert.equal(await instance.tokenName(), ContractName);
    assert.equal(await instance.tokenSymbol(), ContractSymbol);
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed
    let starName_1 = "Super Star 1";
    let starName_2 = "Super Star 2";
    let starName_3 = "Super Star 3";
    let starName_4 = "Super Star 4";
    let starId_1 = 8;
    let starId_2 = 9;
    let starId_3 = 10;
    let starId_4 = 11;
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];

    let instance = await StarNotary.deployed();

    await instance.createStar(starName_1, starId_1, {from: user1});
    await instance.createStar(starName_2, starId_2, {from: user2});
    await instance.createStar(starName_3, starId_3, {from: user1});
    await instance.createStar(starName_4, starId_4, {from: user2});

    // same owner of both stars, no exchange
    await truffleAssert.reverts(instance.exchangeStars(starId_1, starId_3, {from: user1}), "Same owner of both stars. No exchange is needed.");

    // user 1 to initiate the exchange
    await instance.exchangeStars(starId_1, starId_2, {from: user1});

    let owner_1 = await instance.ownerOf(starId_1);
    let owner_2 = await instance.ownerOf(starId_2);
    assert.equal(owner_1, user2);
    assert.equal(owner_2, user1);

    // user 2 to initiate the exchange
    await instance.exchangeStars(starId_3, starId_4, {from: user2});

    // non owner to initiate the exchange
    await truffleAssert.reverts(instance.exchangeStars(starId_3, starId_4, {from: user3}), "Failed to exchange the stars as the message sender is not the owner of both stars.");
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.
    let starName_1 = "Super Star 1";
    let starId_1 = "12";
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];

    let instance = await StarNotary.deployed();

    await instance.createStar(starName_1, starId_1, {from: user1});
    
    // transfer to user 2 as the owner
    await instance.transferStar(user2, starId_1, {from: user1});
    assert.equal(await instance.ownerOf(starId_1), user2);

    // transfer to user 3 as a non owner
    await truffleAssert.reverts(instance.transferStar(user3, starId_1, {from: user1}), "Star cannot be transferred as the sender is not the owner.");

    // transfer the star to itself
    await truffleAssert.reverts(instance.transferStar(user2, starId_1, {from: user2}), "Owner cannot transfer the star to itself.");
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    // 2. Call your method lookUptokenIdToStarInfo
    // 3. Verify if you Star name is the same
    let starName_1 = "Super Star 1";
    let starName_2 = "Super Star 2";
    let starId_1 = "6";
    let starId_2 = "7";
    let user1 = accounts[1];

    let instance = await StarNotary.deployed();
    await instance.createStar(starName_1, starId_1, {from: user1});
    await instance.createStar(starName_2, starId_2, {from: user1});
    let lookupName_1 = await instance.lookUptokenIdToStarInfo(starId_1);
    let lookupName_2 = await instance.lookUptokenIdToStarInfo(starId_2);

    assert.equal(lookupName_1, starName_1);
    assert.equal(lookupName_2, starName_2);
    await truffleAssert.reverts(instance.lookUptokenIdToStarInfo(99999), "Error in looking up the star of token.");
});
