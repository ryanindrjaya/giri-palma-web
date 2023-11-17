export const capitalize = (str: string) => {
  const strArr = str.split("-");
  if (strArr.length > 1) {
    return strArr.map((item) => item[0].charAt(0).toUpperCase() + item.slice(1)).join(" ");
  } else {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};
