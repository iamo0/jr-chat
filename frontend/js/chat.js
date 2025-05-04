var el = document.querySelector('.more');
var btn = el.querySelector('.more-btn');
var menu = el.querySelector('.more-menu');
var visible = false;

function showMenu(e) {
    e.preventDefault();
    if (!visible) {
        visible = true;
        el.classList.add('show-more-menu');
        menu.setAttribute('aria-hidden', false);
        document.addEventListener('mousedown', hideMenu, false);
    }
}

function hideMenu(e) {
    if (btn.contains(e.target)) {
        return;
    }
    if (visible) {
        visible = false;
        el.classList.remove('show-more-menu');
        menu.setAttribute('aria-hidden', true);
        document.removeEventListener('mousedown', hideMenu);
    }
}

btn.addEventListener('click', showMenu, false);


var el1 = document.querySelector('.more1');
var btn1 = el.querySelector('.more-btn1');
var menu1 = el.querySelector('.more-menu1');
var visible = false;

function showMenu1(e) {
    e.preventDefault();
    if (!visible) {
        visible = true;
        el1.classList.add('show-more-menu');
        menu1.setAttribute('aria-hidden', false);
        document.addEventListener('mousedown', hideMenu, false);
    }
}

function hideMenu1(e) {
    if (btn1.contains(e.target)) {
        return;
    }
    if (visible) {
        visible = false;
        el1.classList.remove('show-more-menu');
        menu1.setAttribute('aria-hidden', true);
        document.removeEventListener('mousedown', hideMenu1);
    }
}

btn1.addEventListener('click', showMenu1, false);