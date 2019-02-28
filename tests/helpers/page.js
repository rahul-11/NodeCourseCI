const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');


class CustomPage {
  constructor(page){
    this.page = page;
  }

  static async build(){
    const browser = await puppeteer.launch({
      headless : true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    // THE MOST IMPORTANT PART OF THIS FILE : MAKING PROXY 
    return new Proxy(customPage,{
      get : function(target, property){
        return customPage[property] || browser[property] || page[property];
      }
    })
  }

  async login(){
    const user = await userFactory();
    const {session, sig} = sessionFactory(user);

    await this.page.setCookie({name: 'session', value: session});
    await this.page.setCookie({name: 'session.sig', value: sig});
    await this.page.goto('localhost:3000/blogs');
    await this.page.waitFor('a[href="/auth/logout"]');
  }

  async getContentsOf(selector){
    return this.page.$eval(selector, el => el.innerHTML);
  }

  get(path){
    return this.page.evaluate((url)=>{
      return fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json());
    }, path);
  }

  post(path,data){
    return this.page.evaluate((url, data)=>{
      return fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers:{
          'Content-Type': 'application/json'
        },
        body:JSON.stringify(data)
      })
      .then(res => res.json());
    }, path, data);
  }

  execRequests(actions){
    return Promise.all(
      actions.map(({method, path, data}) =>{    // Destructuring the action object
        return this[method](path, data);        // [method] is string interpretation in Javascript
      })
    );
  }

}

module.exports = CustomPage;
