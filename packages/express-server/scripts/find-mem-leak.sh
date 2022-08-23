# 启动服务器，每次请求重复渲染 -r 参数后面的次数
node ./dist/index.js start ../client -r 100 2>&1 1>/dev/null &
sleep 0.5
# 切换为需要测试的页面链接
curl http://127.0.0.1:3000/?id=fyt > /dev/null &

if [[ $OSTYPE == 'darwin'* ]]; then
  top -o MEM
else
  top -o %MEM
fi
