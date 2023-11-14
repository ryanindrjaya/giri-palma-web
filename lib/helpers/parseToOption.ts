export function parseToOption(data: any[], value?: string, label?: string) {
  if (value && label) {
    return data.map((item) => ({
      value: item[value],
      label: item[label],
    }));
  } else {
    return data.map((item) => ({
      value: item,
      label: item,
    }));
  }
}
