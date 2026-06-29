export const logProxy = (val: any, extra = '') => {
  console.log(`🚀 ~ logProxy ~ ${extra}`, JSON.parse(JSON.stringify(val)));
};
