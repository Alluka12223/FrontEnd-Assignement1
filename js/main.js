// HTML-component + SPA/routing example in Vanilla JS
// © ironboy, Node Hill AB, 2023

// import the main scss file: the scss will compile to css
// and hot reload on changes thanks to Vite
import '../scss/style.scss';
import './shopping-cart-main';
import { getJSON } from './utils/getJson';
// import bootstrap JS part
import * as bootstrap from 'bootstrap';

// helper: grab a DOM element
const $ = el => document.querySelector(el);

// helper: fetch a text/html file (and remove vite injections)
const fetchText = async url => (await (await (fetch(url))).text())
  .replace(/<script.+?vite\/client.+?<\/script>/g, '');

// helper: replace a DOM element with new element(s) from html string
function replaceElement(element, html, remove = true) {
  let div = document.createElement('div');
  div.innerHTML = html;
  for (let newElement of [...div.children]) {
    element.after(newElement, element);
  }
  remove && element.remove();
}

// mount components (tags like <component="app"> etc 
// will be replaced with content from the html folder)
async function componentMount() {
  while (true) {
    let c = $('component');
    if (!c) { break; }
    let src = `/html${c.getAttribute('src')}.html`;
    let html = await fetchText(src);
    replaceElement(c, html);
  }
  repeatElements();
}

// repeat DOM elements if they have the attribute 
// repeat = "x" set to a positive number
function repeatElements() {
  while (true) {
    let r = $('[repeat]');
    if (!r) { break; }
    let count = Math.max(1, +r.getAttribute('repeat'));
    r.removeAttribute('repeat');
    for (let i = 0; i < count - 1; i++) {
      let html = unsplashFix(r.outerHTML);
      replaceElement(r, html, false);
    }
  }
}

// special fix on repeat of random unsplash image
// (so that we don't cache and show the same image)
function unsplashFix(html) {
  return html.replace(
    /(https:\/\/source.unsplash.com\/random\/?[^"]*)/g,
    '$1&' + Math.random()
  );
}

// listen to click on all a tags
$('body').addEventListener('click', e => {
  let aElement = e.target.closest('a');
  if (!aElement) { return; }
  let href = aElement.getAttribute('href');
  // do nothing if external link (starts with http)
  if (href.indexOf('http') === 0) { return; }
  // do nothing if just '#'
  if (href === '#') { return; }
  // prevent page reload
  e.preventDefault();
  // 'navigate' / change url
  history.pushState(null, null, href);
  // load the page
  loadPage(href);
});

// when the user navigates back / forward -> load page
window.addEventListener('popstate', () => loadPage());

// load page - soft reload / à la SPA 
// (single page application) of the main content
const pageCache = {};
async function loadPage(src = location.pathname) {
  src = src === '/' ? '/start' : src;
  src = `/html/pages/${src}.html`;
  let html = pageCache[src] || await fetchText(src);
  pageCache[src] = html;
  $('main').innerHTML = html;
  // run componentMount (mount new components if any)
  componentMount();
  // set active link in navbar
  setActiveLinkInNavbar();
  if (window.location.pathname === "/books") {
    start();
  }
}

// set the correct link active in navbar match on
// the attributes 'href' and also 'active-if-url-starts-with'
function setActiveLinkInNavbar() {
  let href = location.pathname;
  let oldActive = $('nav .active');
  let newActive = $(`nav a[href="${href}"]:not(.navbar-brand)`);
  if (!newActive) { // match against active-if-url-starts-with
    for (let aTag of $('nav').querySelectorAll('a')) {
      let startsWith = aTag.getAttribute('active-if-url-starts-with');
      newActive = startsWith && href.indexOf(startsWith) === 0 && aTag;
      if (newActive) { break; }
    }
  }
  oldActive && oldActive.classList.remove('active');
  newActive && newActive.classList.add('active');
}

let allBook;
let bookItem;

let authorFilter = 'All';
let categoryFilter = "All"
let priceFilter = "All"
let sort = "None";

let authors = [];
let categories = []

function displayBooks() {
  let bookFilter = filterAll();
  bookItem = bookFilter.map(({ id, title, author, url, category, description, price }) => /*html*/ `
  
    <div class="col-md-3">
      <div class="photo hovering-box">
        <img src="${url}" class="img-fluid" alt=${title}>
        <div class="overlay">
          <div class="col">
            <h5 class="font-weight-bolder">${title} | ${category}</h5>
              <p>Author: ${author}</p>
              <p>${price}</p>
              
              <button type="button" class="btn btn-outline-primary read-more" data-bs-toggle="modal" data-bs-target="#exampleModal" data-id=${id}>
              Read More
              </button>
              
              <button href="#start" class="btn btn-primary add-to-basket" data-id=${id}>
                Add to Cart
              </button>
          </div>
        </div>
      </div>
    </div>
    `
  )
  document.querySelector(".allBooks").innerHTML = bookItem.join("")
}

// function addFilters() {
//   document.querySelector(".filters").innerHTML = /*html*/ `
//     <label><span>Filter by </span>
//       <select class="filter">
//         <option>category</option>
//         <option>author</option>
//         <option>price</option>
//       </select> :
//       <select class="filteringCondition">
//         <option>all</option>
//         ${categories.map((category) => `<option>${category}</option>`).join("")}
//       </select>
//     </label>
//   `;
// }

function filterAll() {
  let filteredBooks
  if (priceFilter === "All") {
    filteredBooks = allBook.filter(({ author, category, price }) => (authorFilter === "All"
      || author.includes(authorFilter))
      && (categoryFilter === "All" || categoryFilter === category)
      && (priceFilter === "All"))


  } else if (priceFilter === "1000+ SEK") {
    filteredBooks = allBook.filter(({ author, category, price }) => (authorFilter === "All"
      || author.includes(authorFilter))
      && (categoryFilter === "All" || categoryFilter === category)
      && (price > 1000))

  } else {
    let min = priceFilter.split(" ")[0]
    let max = priceFilter.split(" ")[2]
    filteredBooks = allBook.filter(({ author, category, price }) => (authorFilter === "All"
      || author.includes(authorFilter))
      && (categoryFilter === "All" || categoryFilter === category)
      && (price >= min && price < max))
  }

  return filteredBooks
} 

function getCategories() {
  let allCategory = allBook.map(book => book.category)
  categories = [...new Set(allCategory)]
  console.log('sort', categories.sort())

}

function cateSort() {
  getCategories();
  document.querySelector(".category-filtering").innerHTML = /*html*/`
  <label> Category:
  <select class="categoryFilter form-select" aria-label="Category">
  <option>All</option>
  ${categories.map(category => `<option> ${category} </option>`).join("")}
  </select>
  </label>
  `;

  document.querySelector(".categoryFilter").addEventListener('change', event => {
    categoryFilter = event.target.value;
    // let filteredBooks = allBook.filter(({category}) => (categoryFilter === "All" || categoryFilter === category))
    displayBooks()
  })
}

function getAuthors() {
  let allAuth = allBook.map(book => book.author)
  authors = [...new Set(allAuth)]
  console.log('sort', authors.sort())

}

function authSort() {
  getAuthors();
  document.querySelector(".author-filtering").innerHTML = /*html*/`
  <label> Author:
  <select class="authorFilter form-select" aria-label="Category">
  <option>All</option>
  ${authors.map(author => `<option> ${author} </option>`).join("")}
  </select>
  </label>
  `;

  document.querySelector(".authorFilter").addEventListener('change', event => {
    authorFilter = event.target.value;
    // let filteredBooks = allBook.filter(({category}) => (categoryFilter === "All" || categoryFilter === category))
    displayBooks()
  })
}

function priceSort() {
  document.querySelector(".price-filtering").innerHTML = /*html*/`
    <label> Price:
      <select class="priceFilter form-select" aria-label="Price">
        <option>All</option>
        <option>0</option>
        <option>26 - 50 SEK</option>
        <option>51 - 75 SEK</option>
        <option>100+ SEK</option>
      </select>
    </label>
    `;

  document.querySelector(".priceFilter").addEventListener('change', event => {
    priceFilter = event.target.value;
    displayBooks()
  })
}

async function start() {
  allBook = await getJSON('/book-data.json')
  displayBooks()
  // addFilters()
  cateSort()
  authSort()
  priceSort()
}

$('body').addEventListener('click', event => {
  console.log("button clicked")
  let readMore = event.target.closest('.read-more')
  if (readMore) {
    const id = Number(readMore.getAttribute("data-id"))
    let b = allBook.filter(b => b.id === id)
    console.log('b', b)
    // document.querySelector('.book-title-main').innerHTML = b[0].title;
    document.querySelector('.book-title').innerHTML = b[0].title;
    document.querySelector('.book-author').innerHTML = b[0].author;
    document.querySelector('.book-description').innerHTML = b[0].description;
    document.querySelector('.book-category').innerHTML = b[0].category;
    document.querySelector('.book-price').innerHTML = b[0].price;
    let cover = `<img src=${b[0].url} alt=${b[0].title}
    class="col-sm-12 col-lg-5 float-md-end mb-3 ms-md-3">`
    document.querySelector('.book-cover').innerHTML = cover;
    let addButton = `<button type="button" data-id=${id} class="btn btn-primary add-to-basket-2">Add to Basket</button>`
    document.querySelector('.modal-footer').innerHTML = addButton
  }
})

// initially, on hard load/reload:
// mount components and load the page
componentMount().then(x => loadPage());