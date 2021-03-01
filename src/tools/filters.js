/**
 * 时间格式转换过滤器
 * @param {String} val 日期字符串 如：2020-03-04T16:00:00
 * @param {String} joint 日期之间连接符号
 * @param {Number} substr 截取位数 默认19位： 2020-03-04T16:00:00 → 2020-03-04 16:00:00
 * @example {{ date | formatDate('-', 16)}} 2020-03-04T16:00:00 → 2020-03-04 16:00
 */
exports.formatDate = (val, joint = "-", substr = 19) => {
  if (!val) return val;
  let time = new Date(val).getTime(); // 格式化为日期对象 转为时间戳
  let date = new Date(time + 8 * 3600 * 1000); // 格林威治时间，差八个小时。
  try {
    date = date
      .toJSON()
      .substr(0, substr)
      .replace("T", " ")
      .replace(/-/g, joint);
  } catch (e) {
    console.error(e);
    return val;
  }
  // console.log(date);
  return date;
};
