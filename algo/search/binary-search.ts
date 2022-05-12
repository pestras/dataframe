export function binarySearch<T = number>(arr: T[], elem: T, inv = false) {
  let start = 0, end = arr.length - 1, mid = Math.floor((start + end) / 2);

  while (arr[mid] !== elem && start <= end) {

    if (elem < arr[mid]) inv ? start = mid + 1 : end = mid - 1;
    else inv ? end = mid - 1 : start = mid + 1;

    mid = Math.floor((start + end) / 2);
  }

  return arr[mid] === elem ? mid : -1;
}