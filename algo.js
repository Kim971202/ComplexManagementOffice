let arr = [5, 3, 1, 3, 4, 6, 2];

for(i = 0; i < arr.length; ++i){
    for(j = 0; j < arr.length; ++j){
        if(arr[i] < arr[j]){
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
}

for(i = 0; i < arr.length; ++i){
    console.log(arr[i]);
}