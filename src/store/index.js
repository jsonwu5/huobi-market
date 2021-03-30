import Vue from "vue";
import Vuex from "vuex";
import $http from "@/http";
import { searchByKeyword } from "@/tools";
import { setStorage, getStorage, KYELIST } from "@/tools/storage.js";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    // 所有支持的币列表
    coinList: [],
    // 我的自选币种列表
    myCoinList: [],
    // 行情表格展示的字段
    tableKeys: [],
    // 置顶自选币种列表
    stickList: [],
    // Manifest配置文件
    manifest: {},
    // 币种选择器 币种列表
    coinSelectList: [],
    // 用户配置数据
    userOptions: {},
    // 涨跌色切换 true = 红涨 false = 绿涨
    // 默认是红涨
    upsColor: true,
    // 角标上展示的币种
    badgeCoin: "",
    // 上次排序的配置
    sortConfig: {},
    // 国际化翻译配置
    i18nList: {},
    // 用户设置的语言
    userLang: "",
    // 表格列宽度缓存
    tableWidths: []
  },
  getters: {
    i18n: state => {
      const keys = Object.keys(state.i18nList);
      const list = {};
      keys.forEach(item => {
        list[item] = state.i18nList[item].message;
      });
      return list;
    }
  },
  mutations: {
    _setCoinList(state, val) {
      state.coinList = val;
    },
    _setMyCoinList(state, val) {
      state.myCoinList = val;
      setStorage({ myCoinList: val });
    },
    _setTableKeys(state, val) {
      state.tableKeys = val;
      setStorage({ tableKeys: val });
    },
    _setStickList(state, val) {
      state.stickList = val;
      setStorage({ stickList: val });
    },
    _setManifest(state, val) {
      state.manifest = val;
    },
    _setCoinSelectList(state, val) {
      state.coinSelectList = val;
    },
    _setUserOptions(state, val) {
      state.userOptions = val;
      setStorage({ userOptions: val });
    },
    _setUpsColor(state, val) {
      state.upsColor = val;
      setStorage({ upsColor: val });
    },
    _setBadgeCoin(state, val) {
      state.badgeCoin = val;
      setStorage({ badgeCoin: val });
    },
    _setSortConfig(state, val) {
      state.sortConfig = val;
      setStorage({ sortConfig: val });
    },
    _setI18nList(state, val) {
      state.i18nList = val;
    },
    _setUserLang(state, val) {
      state.userLang = val;
      setStorage({ userLang: val });
    },
    _setTableWidths(state, val) {
      state.tableWidths = val;
      setStorage({ tableWidths: val });
    }
  },
  actions: {
    // 获取火币支持的币种
    _getCoinList({ commit }) {
      $http.get("/v1/common/currencys").then(res => {
        commit("_setCoinList", res.data);
      });
    },
    /**
     * 获取国际化翻译配置文件
     * @param commit
     * @param lang { String } 用户的浏览器当前语言环境 en/zh_CN等
     * @returns {Promise<unknown>}
     * @private
     */
    _getLanguageAll({ commit, state }) {
      // 请求本地语言配置文件
      function getLocales(userLang, callback) {
        $http
          .get(chrome.extension.getURL(`_locales/${userLang}/messages.json`))
          .then(res => {
            commit("_setI18nList", res);
          })
          .catch(callback);
      }

      getLocales(state.userLang, () => {
        // 没有获取到指定的语言配置文件时，重新请求默认中文语言的配置文件
        getLocales("zh_CN");
        // 更新设置
        commit("_setUserLang", "zh_CN");
      });
    },
    // 获取当前的manifest.json配置
    _getManifest({ commit }) {
      // 通过API
      commit("_setManifest", chrome.runtime.getManifest());
      // 通过请求
      // $http.get(chrome.extension.getURL("manifest.json")).then(res => {
      //   commit("_setManifest", res);
      // });
    },
    /**
     * 分页查询币种列表，支持关键字过滤
     * @param commit
     * @param state
     * @param pageNumber { Number } 页码
     * @param resultSize { Number } 每页条数
     * @param coinName { String } 搜索的币种关键字
     * @private
     */
    _getCoinPager({ commit, state }, { pageNumber, resultSize, coinName }) {
      let list = state.coinList;
      // 搜索过滤
      if (coinName) {
        list = searchByKeyword(state.coinList, coinName);
      }
      let res = {
        // 1 10  0 10
        // 2 10  10 20
        // 3 10 20 30
        list: list.slice(
          (pageNumber - 1) * resultSize,
          (pageNumber - 1) * resultSize + resultSize
        ),
        total: list.length
      };
      return new Promise(resolve => {
        const timer = setTimeout(() => {
          commit("_setCoinSelectList", res.list);
          clearTimeout(timer);
          resolve(res);
        }, 100);
      });
    },
    /**
     * 初始化，同步chrome账户的缓存配置数据更新到vuex
     * @param commit
     * @returns {Promise<unknown>}
     * @private
     */
    _initCache({ commit }) {
      return new Promise((resolve, reject) => {
        getStorage(KYELIST)
          .then(res => {
            // console.log(res);
            for (let key in res) {
              const value = res[key];
              const commitKey = key.slice(0, 1).toUpperCase() + key.slice(1);
              commit(`_set${commitKey}`, value);
            }
            resolve(res);
          })
          .catch(reject);
      });
    },
    /**
     * 导入配置并更新vuex数据
     * @param commit
     * @param res
     * @private
     */
    _importConfig({ commit }, res = {}) {
      for (let key in res) {
        const value = res[key];
        const commitKey = key.slice(0, 1).toUpperCase() + key.slice(1);
        commit(`_set${commitKey}`, value);
        // 重启插件
        // chrome.runtime.reload();
        location.reload();
      }
    }
  },
  modules: {}
});
