<template>
  <!-- 新增产品 -->
  <a-modal
    title="更新日志"
    wrapClassName="changeLog"
    :visible="show"
    @cancel="close()"
    centered
    :footer="null"
  >
    <div class="wrap">
      <a-timeline :pending="loading ? '加载中...' : ''" :reverse="false">
        <a-timeline-item v-for="(item, index) in records" :key="item.node_id">
          <div class="mt5 bold">
            <span>版本：{{ item.name }}</span>
            <a-tag class="ml5" color="#108ee9" v-if="index === 0">
              {{
                item.tag_name === `v${manifest.version}`
                  ? "当前版本"
                  : "最新版本"
              }}
            </a-tag>
            <a-tag
              class="ml5"
              v-else-if="item.tag_name === `v${manifest.version}`"
            >
              当前版本
            </a-tag>
          </div>
          <div class="mt5">日期：{{ item.created_at | formatDate }}</div>
          <div class="mt5" v-html="marked(item.body)"></div>
        </a-timeline-item>
      </a-timeline>
      <div class="mt10 flex ac jc">
        <a-button
          :disabled="nextDisabled"
          class="ml5"
          @click="getReleases('next')"
          >加载更多</a-button
        >
      </div>
    </div>
  </a-modal>
</template>

<script>
import marked from "marked";
import { mapState } from "vuex";

export default {
  name: "changeLog",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      marked,
      show: false,
      records: [],
      nextDisabled: false,
      loading: false,
      params: {
        per_page: 10,
        page: 1
      }
    };
  },
  watch: {
    visible: {
      handler(val) {
        this.show = val;
      },
      immediate: true
    }
  },
  computed: {
    ...mapState(["manifest"])
  },
  created() {
    this.getReleases();
  },
  methods: {
    close() {
      this.$emit("update:visible", false);
    },
    getReleases(type = "") {
      if (type === "next") {
        this.params.page++;
      } else if (type === "refresh") {
        this.params.page = 1;
      }
      this.loading = true;
      // https://api.github.com/repos/[用户名]/[仓库名]/releases/latest
      this.$http
        .get("https://api.github.com/repos/jsonwu5/huobi-market/releases", {
          params: this.params
        })
        .then(res => {
          if (res.length < this.params.per_page) {
            this.nextDisabled = true;
          }
          if (type === "refresh") {
            this.records = [];
          }
          this.records = this.records.concat(res);
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style lang="less">
.changeLog {
  .wrap {
    height: 400px;
    overflow-y: scroll;
  }
  .ant-modal-body {
    padding: 15px 10px;
  }
}
</style>
