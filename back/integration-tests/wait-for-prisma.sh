attempt_counter=0
max_attempts=30

until [ $(curl -s -o /dev/null -w '%{http_code}' http://prisma:4467) -eq 200 ]; do
    if [ ${attempt_counter} -eq ${max_attempts} ];then
      echo "Max attempts reached, prisma is not up yet"
      exit 1
    fi

    echo ">> Waiting for Prisma to wake up ⌚..."
    attempt_counter=$(($attempt_counter+1))
    sleep 1
done

echo ">> Prisma is up 👍"
