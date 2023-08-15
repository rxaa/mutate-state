import { useEffect, useRef, useState } from "react";
import { RefState } from "./RefState";


export interface UpadteFunc {

    /**
     * 触发整个页面更新
     */
    $update: void;

}


// export interface UpadteFunc2 {

//     /**
//      * 触发整个页面更新，update重名时的备用
//      */
//     $update_: void;
// }

/**
 * 包含$update属性的状态
 */
export type WithUpadte<T> = T extends UpadteFunc ? T : T & (UpadteFunc);

/**
 * 用于获取对象的属性
 */
export type ObjStateType<T> = [T, keyof T]
export type ObjStateType2<T> = [T, keyof T, keyof T]

function addFunc(num: number) {
    return num + 1;
}

function defineProp(ret: any, setRes: (p: any) => void, key: string) {

    Object.defineProperty(ret, key, {
        enumerable: false,
        get() { setRes(addFunc); },
    })
}


/**
 * 用于获取可变prop
 */
export type WithProp<T, PropT> = T & {
    /**
     * 获取可变属性
     */
    prop_: PropT
}

/**
 * 保存所有状态<class,object>
 */
const stateMaps = new Map<any, Array<any>>();


/**
 * 查找指定类型的状态
 * @param clas 状态类型
 * @param res 结果回调
 */
export function findState<T extends object>(clas: { new(...prop: any[]): T }, res?: (obj: T, index: number) => void): Array<T> {
    let arr = stateMaps.get(clas);
    if (arr && res) {
        for (let i = 0; i < arr.length; i++) {
            res(arr[i], i);
        }
    }
    return arr ?? [];
}


//父类$update状态
let parentObj: ((it: number) => void) | null = null;

/**
 * 用于在状态类中创建子状态
 * @param func 
 * @returns 
 */
export function createSubState<T extends { $update: void }>(func: () => T): T {
    let obj = func();
    if (parentObj) {
        defineProp(obj, parentObj, "$update")
    }
    return obj;
}

/**
 * 创建可变object类型状态
 * useObjState简化版
 * 不保存class状态至stateMaps
 * @param func 
 * @param prop 
 * @returns 
 */
export function useObject<T, PropT>(func: () => T, prop?: PropT): WithUpadte<T> {
    let ref = useRef(null as WithUpadte<WithProp<T, PropT>> | null)
    let [res, setRes] = useState(0); /*eslint @typescript-eslint/no-unused-vars:0 */


    if (ref.current === null) {
        parentObj = setRes;
        let ret = func() as WithUpadte<WithProp<T, PropT>>;
        parentObj = null;
        defineProp(ret, setRes, "$update")
        if ((prop as RefState<any>)?.onRefState) {
            (prop as RefState<any>)!.onRefState!(ret)
        }
        // if (ret.$update_ === undefined) {
        //     defineProp(ret, setRes, "$update_")
        // }
        ref.current = ret
    }

    if (prop) {
        ref.current.prop_ = prop;
    }

    return ref.current;
}


/**
 * 创建可变object类型状态
 * @param func object创建函数
 * @param prop 组件属性
 * @returns 
 */
export function useObjState<T, PropT>(func: () => T, prop?: PropT): WithUpadte<T> {

    let ref = useRef(null as WithUpadte<WithProp<T, PropT>> | null)
    let [res, setRes] = useState(0); /*eslint @typescript-eslint/no-unused-vars:0 */


    if (ref.current === null) {
        parentObj = setRes;
        let ret = func() as WithUpadte<WithProp<T, PropT>>;
        parentObj = null;
        defineProp(ret, setRes, "$update")
        if ((prop as RefState<any>)?.onRefState) {
            (prop as RefState<any>)!.onRefState!(ret)
        }
        // if (ret.$update_ === undefined) {
        //     defineProp(ret, setRes, "$update_")
        // }
        ref.current = ret
    }

    if (prop) {
        ref.current.prop_ = prop;
    }


    //暂存具名class状态至stateMaps
    useEffect(() => {
        let obj = ref.current;
        let clas = obj?.constructor;
        if (clas && clas?.name !== "Object") {
            let arr = stateMaps.get(clas);
            if (!arr) {
                arr = [];
                stateMaps.set(clas, arr);
            }
            arr.push(obj);
            return () => {
                for (let i = arr!.length - 1; i >= 0; i--) {
                    if (arr![i] == obj) {
                        arr?.splice(i, 1);
                        break;
                    }
                }
                if (arr!.length == 0) {
                    stateMaps.delete(clas);
                }
            }
        }
        return;
    }, [])


    return ref.current;
}


/**
 * 触发指定对象的onMount与onUnmount事件
 * @param clas 
 */
export function useOnMount(clas: { onMount: () => any, onUnmount: () => any }) {
    useEffect(() => {
        clas.onMount();
        return () => {
            clas.onUnmount();
        }
    }, [])
}

/**
 * 组件初始化,相当于componentDidMount与componentWillUnmount
 * @param func 
 */
export function useInit(func: () => Promise<void | (() => Promise<void>)>) {
    let funcRef = useRef(func)
    useEffect(() => {

        let ret = funcRef.current();
        let retFunc: any = null;
        ret.then(it => {
            retFunc = it;
        })

        return () => {
            if (retFunc instanceof Function) {
                retFunc()
            }
        }
    }, [])
}
