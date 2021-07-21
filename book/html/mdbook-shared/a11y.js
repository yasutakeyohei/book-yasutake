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
  const a11yFontFamilyInput = document.getElementById('a11y-font-family-name');

   /* 利用可能ステートとデフォルトステートをindex.hbsから取得 */
   /* fontFamilyNameだけ別扱い */
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
      if (state[key] === "font-family-input") {
        a11yFontFamilyInput.value = state["fontFamilyName"];
      }
    });
  }

  /*
    {
      fontFamily: "font-family-input",
      fontFamilyName: "（ユーザーが指定）",
      fontSize: "font-size-2",
      letterSpacing: "letter-spacing-2",
      lineHeight: "line-height-2",
      ruby: "ruby-off",
      theme: "light"
    }
  */
  const setState = (newState, store = true) => {
    /* 一旦全クラス削除 */
    for (const v of Object.values(availableStates)) {
      for(const cls of v) {
        html.classList.remove(cls);
      }
    }

    state = {...state, ...newState}; //merge state

    /* ステートにもとづいてクラスを設定 */
    for (const [key, val] of Object.entries(state)) {
      if (key !== "fontFamilyName") {
        html.classList.add(val);
      }
    }

    /* 任意のfont-familyを設定している場合 */
    if (state.fontFamily === "font-family-input") {
      html.style.fontFamily = state.fontFamilyName;
    } else {
      html.style.removeProperty("font-family");
    }

    /* type squre の動的ロード */
    if (state.fontFamily === "font-family-ud2") {
      if (!document.body.contains(document.getElementById('typesquare-script'))) {
        const script = document.createElement('script');
        script.id = "typesquare-script";
        script.src = "//typesquare.com/3/tsst/script/ja/typesquare.js?60267d718df44b799ec17594ac1e02e5";
        document.body.appendChild(script);
      }
    }
 
    if (store) {
      try {
        localStorage.setItem('mdbook-state', JSON.stringify(state));
      } catch (e) {}
    }
    updatePopup();
  }

  /* stateが有効か確認。fontFamilyNameだけ別扱い */
  const validateState = (newState) => {
    const s = {...defaultState};
    for (const [k, v] of Object.entries(newState)) {
      if (k === "fontFamilyName") {
        s[k] = newState[k];
      } else {
        if (k in availableStates) {
          s[k] = availableStates[k].includes(v) ? newState[k] : defaultState[k];
        }
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

  a11yFontFamilyInput.addEventListener('keyup', (e) => {
    const id = e.target.id;
    if (id == "a11y-font-family-name") {
      setState({fontFamilyName: e.target.value})
    }
  })

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

/* click to set font-family */
const a11ySetFontFamily = (fontFamily) => {
  const a11yFontFamilyInput = document.getElementById('a11y-font-family-name');
  a11yFontFamilyInput.value = fontFamily;
  a11yFontFamilyInput.dispatchEvent(new Event("keyup", {bubbles:true}));
  a11yFontFamilyInput.dispatchEvent(new MouseEvent("click", {bubbles:true}));
}
