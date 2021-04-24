<template>
  <div class="setting relative">
    <div class="list">
      <div v-for="(item, index) in list" :key="item.key">
        <div v-if="index === list.length - 2" class="interval"></div>
        <div
          class="item flex ac jsb pl15 pr15 pt10 pb10 pointer"
          @click="clickItem(item)"
        >
          <div>
            <a-icon :type="item.icon" />
            <span class="ml5">{{ item.name }}</span>
          </div>
          <div>
            <span class="mr5">{{ item.desc || "" }}</span>
            <a-icon :size="16" type="right" />
          </div>
        </div>
        <a-divider style="margin: 0" />
      </div>
    </div>
    <div v-if="showPage" class="page absolute width-100 height-100">
      <configuration
        v-if="settingVisible"
        @back="showPage = false"
      ></configuration>
    </div>

    <change-log
      v-if="changeLogVisible"
      :visible.sync="changeLogVisible"
    ></change-log>

    <support v-if="supportVisible" :visible.sync="supportVisible"></support>
  </div>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import Configuration from "@components/configuration";
import { clearStorage } from "@tools/storage";
import ChangeLog from "@components/dialog/changeLog";
import Support from "@components/dialog/support";

export default {
  name: "setting",
  components: { Support, ChangeLog, Configuration },
  data() {
    return {
      showPage: false,
      settingVisible: false,
      changeLogVisible: false,
      supportVisible: false
    };
  },
  computed: {
    ...mapState(["manifest", "userLang", "openType"]),
    ...mapGetters(["i18n"]),
    list() {
      return [
        {
          name: "功能设置",
          icon: "setting",
          key: "setting",
          url: "",
          type: 3 // 0 = 点击事件 1 = 链接 2 = 弹窗 3 = 页面
        },
        {
          name: "常见问题",
          icon: "question-circle",
          key: "question",
          type: 1,
          url: "https://support.qq.com/products/313772/faqs-more"
        },
        {
          name: "Github",
          icon: "github",
          key: "github",
          type: 1,
          url: "https://github.com/jsonwu5/huobi-market"
        },
        {
          name: "更新日志",
          icon: "rocket",
          key: "changeLog",
          type: 2,
          url: ""
        },
        {
          name: "打赏作者",
          icon: "coffee",
          key: "support",
          type: 2,
          url: ""
        },
        {
          name: "清除缓存",
          icon: "rest",
          key: "rest",
          type: 0,
          url: ""
        },
        {
          name: "当前版本",
          icon: "info-circle",
          key: "info",
          type: -1,
          url: "",
          desc: `v${this.manifest.version}`
        },
        {
          name: "吐个槽",
          icon: "message",
          key: "message",
          type: 1,
          url: "https://support.qq.com/products/313772"
        }
      ];
    }
  },
  methods: {
    clearLocalStorage() {
      clearStorage().then(() => {
        // this.$message.success(this.i18n.clearMsg || "清除成功, 下次打开生效");
        // 通知角标重新初始化
        chrome.runtime.sendMessage({
          type: "refreshBadge"
        });
        location.reload();
      });
    },
    clickItem(item) {
      // 0 = 点击事件 1 = 链接 2 = 弹窗 3 = 页面
      switch (item.type) {
        case 0:
          if (item.key === "rest") {
            this.$confirm({
              content:
                this.i18n.clearCacheWarn ||
                "清除缓存后会重置为默认自选，是否清除？",
              onOk: () => {
                this.clearLocalStorage();
              },
              onCancel: () => {
                this.$destroyAll();
              }
            });
          }
          break;
        case 1:
          chrome.tabs.create({ url: item.url });
          break;
        case 2:
          this[`${item.key}Visible`] = true;
          break;
        case 3:
          this[`${item.key}Visible`] = true;
          this.showPage = true;
          break;
      }
    }
  }
};
</script>

<style scoped lang="less">
.setting {
  overflow: auto;
  min-width: 380px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  transition: all 0.3s;
  background-color: #f5f5f5;
  .githubBtn {
    border: none;
    padding: 5px;
  }
  .list {
    background-color: #f5f5f5;
    .item {
      background-color: white;
      border-radius: 4px;
    }
    .interval {
      background-color: #f5f5f5;
      height: 20px;
    }
    .ant-divider {
      background: #eee;
      transform: scaleY(0.5);
    }
  }
  .page {
    background-color: white;
    top: 0;
    left: 0;
  }
}
</style>
