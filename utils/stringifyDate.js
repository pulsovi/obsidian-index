const weekDays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');

export default function stringifyDate (date) {
  const weekDay = weekDays[date.getDay()];
  const monthDay = date.getDate();
  const month = date.getMonth() + 1;
  const year = `${date.getFullYear()}`.slice(-2);
  const hour = date.getHours();
  const minuts = `0${date.getMinutes()}`.slice(-2);
  const seconds = `0${date.getSeconds()}`.slice(-2);
  const datestring = `${weekDay}, ${monthDay}-${month}-${year} ${hour}:${minuts}:${seconds}`;
  return datestring;
}
