/* サイドバーを開く・閉じるアイコンの変更 */
(() => {
  'use strict'
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarToggleIcon = document.getElementById('sidebar-toggle-icon');

  if (sidebarToggle.getAttribute("aria-expanded") === "true") {
    sidebarToggleIcon.classList.replace("fa-chevron-circle-right", "fa-chevron-circle-left");
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === "aria-expanded") {
        if (sidebarToggle.getAttribute("aria-expanded") === "true") {
          sidebarToggleIcon.classList.replace("fa-chevron-circle-right", "fa-chevron-circle-left");
        } else {
          sidebarToggleIcon.classList.replace("fa-chevron-circle-left", "fa-chevron-circle-right");
        }
      }
    })
  })
  observer.observe(sidebarToggle, {
    attributes: true
  })
})();


/* アクセシビリティツール */
(() => {
  const html = document.querySelector('html');
  const a11yToggleButton = document.getElementById('a11y-toggle');
  const a11yPopup = document.getElementById('a11y-list');

   /* 利用可能ステートとデフォルトステートをindex.hbsから取得 */
  let availableStates = {};
  let defaultState = {};
  [...a11yPopup.querySelectorAll("[role='menuitem']")].forEach((elm) => {
    if (availableStates[elm.dataset.key] === undefined) {
      availableStates[elm.dataset.key] = [];
    }
    availableStates[elm.dataset.key].push(elm.dataset.val);
    if (elm.dataset.default) {
      defaultState[elm.dataset.key] = elm.dataset.val;
    }
  });

  let state = {};

  const showA11yPopup = () => {
    a11yPopup.style.display = 'grid';
    a11yToggleButton.setAttribute('aria-expanded', true);
    a11yPopup.querySelectorAll("[role='menuitem']")[0].focus();
  }
  const hideA11yPopup = () => {
    a11yPopup.style.display = 'none';
    a11yToggleButton.setAttribute('aria-expanded', false);
    a11yToggleButton.focus();
  }
  const updatePopup = () => {
    [...a11yPopup.querySelectorAll("[role='menuitem']")].forEach((elm) => {
      elm.classList.remove("selected");
    });
    Object.keys(defaultState).forEach((key) => {
      a11yPopup.querySelector(`[data-key='${key}'][data-val='${state[key]}']`).classList.add("selected");
    });
  }

  const setState = (newState, store = true) => {
    /* 一旦全クラス削除 */
    for (const v of Object.values(availableStates)) {
      for(const cls of v) {
        html.classList.remove(cls);
      }
    }

    state = {...state, ...newState}; //merge state
    /* ステートにもとづいてクラスを設定 */
    for (const cls of Object.values(state)) {
      html.classList.add(cls);
    }
 
    if (store) {
      try {
        localStorage.setItem('mdbook-state', JSON.stringify(state));
      } catch (e) {}
    }
    updatePopup();
  }
  const validateState = (newState) => {
    const s = {...defaultState};
    for (const [k, v] of Object.entries(newState)) {
      if (k in availableStates) {
        s[k] = availableStates[k].includes(v) ? newState[k] : defaultState[k];
      }
    }
    return s;
  }
  const getState = () => {
    let newState = {};
    try {
      newState = JSON.parse(localStorage.getItem('mdbook-state'));
    } catch (e) {}
    return (newState === null || newState === undefined) ? {...defaultState} : {...validateState(newState)};
  }
  setState(getState(), false);


  a11yToggleButton.addEventListener('click', () => {
    a11yPopup.style.display === 'grid' ? hideA11yPopup() : showA11yPopup();
  });

  a11yPopup.addEventListener('click', (e) => {
    const val = e.target.dataset.val || e.target.parentElement.dataset.val;
    if (val === "action") { /* アクションボタンの場合はステートを変更しない */
      const key = e.target.dataset.key || e.target.parentElement.dataset.key;
      if (key === "reset") {
        setState(defaultState);
      } else if (key === "help") {
        location.href = path_to_root + "about-a11y.html"; /* redirect to help page */
      }
    } else {
      setState({[e.target.dataset.key]: val});
    }
  });

  a11yPopup.addEventListener('focusout', (e) => {
    // e.relatedTarget is null in Safari and Firefox on macOS (see workaround below)
    if (!!e.relatedTarget && !a11yToggleButton.contains(e.relatedTarget) && !a11yPopup.contains(e.relatedTarget)) {
      hideA11yPopup();
    }
  });

  // Should not be needed, but it works around an issue on macOS & iOS: https://github.com/rust-lang/mdBook/issues/628
  document.addEventListener('click', (e) => {
    if (a11yPopup.style.display === 'grid' && !a11yToggleButton.contains(e.target) && !a11yPopup.contains(e.target)) {
      hideA11yPopup();
    }
  });

})();