import PropTypes from "prop-types";
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import Node from "./Node";
import styles from '../styles/Board.module.css'
import getBezierCurve from "../utils/bezierCurve";
import handleDropBoard from "../utils/handleDropBoard";

export default function Board(props) {
    const [width, setWidth] = useState(500)
    const [height, setHeight] = useState(500)
    const ref = useRef()
    let resizeObs

    const callback = () => {
        const p = props.parentRef.current


        setWidth(p.offsetWidth - p.lastChild.offsetWidth)
        setHeight(ref.current?.parentNode.offsetHeight - 35)
    }
    useEffect(() => {
        if (!resizeObs)
            resizeObs = new ResizeObserver(callback)
        resizeObs.observe(ref.current?.parentNode)
        callback()
    }, [])


    const [scale, setScale] = useState(1)
    const handleLink = (src, target) => {

        props.hook.setLinks(prev => {
            const c = [...prev]
            const targetInstance = props.hook.nodes.find(n => n.id === target.id)
            const existing = c.findIndex(c => c.target.id === target.id && c.target.attribute.key === target.attribute.key)
            let valid = true
            if (existing > -1) {
                let acceptsArray = targetInstance.inputs.find(f => f.key === target.attribute.key).accept.find(f => f === 'Array')
                valid = valid && acceptsArray !== undefined
            }
            if (valid && !c.find(i => i.source.id === src.id && i.target.id === target.id && i.source.attribute.key === src.attribute.key && i.target.attribute.key === target.attribute.key))
                c.push({
                    source: src,
                    target: target
                })
            else if (valid)
                props.hook.setAlert({
                    type: 'info',
                    message: 'Already linked'
                })
            else
                props.hook.setAlert({
                    type: 'info',
                    message: 'Input doesn\'t support multiple values.'
                })
            return c
        })
    }
    const links = useMemo(() => {
        return props.hook.links.map(l => {
            return {target: l.target.id + l.target.attribute.key, source: l.source.id + l.source.attribute.key}
        })
    }, [props.hook])

    let currentFrame = 0

    const updateLinks = () => {
        let parentBBox = ref.current.getBoundingClientRect()
        const bounding = {
            x: ref.current.scrollLeft - parentBBox.left,
            y: ref.current.scrollTop - parentBBox.top
        }

        links.forEach(l => {
            const target = document.getElementById(l.target)?.getBoundingClientRect()
            const source = document.getElementById(l.source)?.getBoundingClientRect()
            const linkPath = document.getElementById(l.target + '-' + l.source)
            if (target && source && linkPath)
                linkPath.setAttribute('d', getBezierCurve(
                    {
                        x: source.x + bounding.x + 7.5,
                        y: source.y + bounding.y + 7.5
                    },
                    {
                        x1: target.x + bounding.x + 7.5,
                        y1: target.y + bounding.y + 7.5
                    },))
        })
        currentFrame = requestAnimationFrame(updateLinks)
    }

    useEffect(() => {
        currentFrame = requestAnimationFrame(updateLinks)
        return () => {
            cancelAnimationFrame(currentFrame)
        }
    }, [links])


    return (
        <div style={{overflow: 'auto', width: '100%', height: '100%'}}>
            <svg
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault()
                    const n = handleDropBoard(e.dataTransfer.getData('text'))
                    if (n) {

                        const bounding = {
                            x: ref.current.scrollLeft - ref.current.getBoundingClientRect().left,
                            y: ref.current.scrollTop - ref.current.getBoundingClientRect().top
                        }
                        const mousePlacement = {
                            x: e.clientX + bounding.x,
                            y: e.clientY + bounding.y
                        }
                        const current = {
                            x: mousePlacement.x / scale,
                            y: mousePlacement.y / scale
                        }
                        n.x = current.x
                        n.y = current.y
                        props.hook.setNodes(prev => {
                            return [...prev, n]
                        })
                    }
                }}
                width={width * 2}
                height={height * 2}
                ref={ref}
                className={styles.wrapper}
                onMouseDown={e => {
                    if (e.target === ref.current)
                        props.setSelected(undefined)
                }}>
                {props.hook.nodes.map(node => (
                    <React.Fragment key={node.id}>
                        <Node
                            setAlert={props.hook.setAlert}
                            setSelected={props.setSelected} selected={props.selected} node={node} scale={scale}
                            handleLink={handleLink}/>
                    </React.Fragment>
                ))}
                {links.map(l => (
                    <path
                        fill={'none'}
                        stroke={'#0095ff'}
                        strokeWidth={'2'}
                        key={l.target + '-' + l.source} id={l.target + '-' + l.source}/>
                ))}
            </svg>
        </div>
    )
}
Board.propTypes = {
    parentRef: PropTypes.object,
    hook: PropTypes.object,
    selected: PropTypes.string,
    setSelected: PropTypes.func,
}