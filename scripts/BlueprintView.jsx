import Board from "../components/components/Board";
import useScriptingView from "./hooks/useScriptingView";
import Available from "../components/components/Available";
import styles from '../components/styles/Board.module.css'
import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import PropTypes from "prop-types";
import ControlProvider from "../../router/components/ControlProvider";
import ResizableBar from "../../../../components/resizable/ResizableBar";
import useHotKeys from "../../../hooks/useHotKeys";
import {allNodes} from "./templates/AllNodes";
import NodeEditor from "./components/NodeEditor";
import Structure from "./components/Structure";
import mapper from "./compiler/mapper";
import getHotKeys from "./utils/getHotKeys";
import getAvailableNodes from "./utils/getAvailableNodes";
import {AlertProvider, Button} from "@f-ui/core";
import MinimalTabs from "./components/MinimalTabs";
import SettingsProvider from "../../../hooks/SettingsProvider";
import useEditorEngine from "../../../extension/useEditorEngine";
import Viewport from "../../viewport/Viewport";
import FormTabs from "../../scene/components/FormTabs";
import useForm from "../../../components/scene/utils/useForm";
import sceneStyles from '../../../components/scene/styles/Scene.module.css'
import handleDrop from "../../../utils/importer/import";

import ViewportOptions from "../../viewport/ViewportOptions";
import EntityReference from "./nodes/utils/EntityReference";
import LoaderProvider from "../../../../components/loader/LoaderProvider";
import SHADING_MODELS from "../../../engine/templates/SHADING_MODELS";
import {useParams} from "react-router-dom";
import {ROUTER_TYPES} from "../../router/TabRouter";

export default function BlueprintView(props) {
    const {submitPackage} = props
    const {registryID, name} = useParams()
    const file = {registryID, name}
    const alert = useContext(AlertProvider)
    const setAlert = ({type, message}) => {
        alert.pushAlert(message, type)
    }
    const settings = useContext(SettingsProvider)
    const load = useContext(LoaderProvider)
    const engine = useEditorEngine(
        false,
        {
            ...settings,
            shadingModel: SHADING_MODELS.DETAIL
        }, load, setAlert)

    const hook = useScriptingView(file, engine, load)
    const ref = useRef()
    const wrapperRef = useRef()
    const controlProvider = useContext(ControlProvider)
    const [toCopy, setToCopy] = useState([])
    const [selectedVariable, setSelectedVariable] = useState()
    const [scale, setScale] = useState(1)
    const [open, setOpen] = useState(0)
    const [currentTab, setCurrentTab] = useState(0)


    useEffect(() => {
        if (hook.selected.length > 0)
            setSelectedVariable(undefined)
    }, [hook.selected])
    useEffect(() => {
        controlProvider.setTabAttributes(
            [
                {
                    label: 'Compile',
                    group: 'b',
                    icon: <span className={'material-icons-round'} style={{fontSize: '1.2rem'}}>check</span>,
                    disabled: true,
                    onClick: () => null
                },
                {
                    label: 'Save',
                    disabled: !hook.changed,
                    icon: <span className={'material-icons-round'} style={{fontSize: '1.2rem'}}>save</span>,
                    onClick: () => {
                        hook.setChanged(false)
                        hook.setImpactingChange(false)
                        submitPackage(mapper(hook, engine, file), false)
                    }
                },
                {
                    label: 'Save & close',
                    disabled: !hook.changed,
                    icon: <span className={'material-icons-round'} style={{fontSize: '1.2rem'}}>save_alt</span>,
                    onClick: () => submitPackage(mapper(hook, engine, file), true)
                }
            ],
            file.name,
            <span
                style={{fontSize: '1.2rem'}}
                className={`material-icons-round`}
            >
                engineering
            </span>,
            ROUTER_TYPES.BLUEPRINT,
            registryID
        )

    }, [hook.nodes, hook.links, hook.variables, hook.groups, engine.entities, hook.changed, hook.impactingChange])

    useHotKeys({
        focusTarget: file.registryID + '-board-wrapper',
        actions: getHotKeys(hook, submitPackage, setAlert, toCopy, setToCopy)
    }, [hook.selected, hook.links, hook.nodes, toCopy])


    const availableNodes = useMemo(() => {
        return getAvailableNodes(hook)
    }, [hook.variables])

    const currentForm = useForm(
        engine,
        setAlert,
        false,
        hook.quickAccess,
        load,
        currentTab
    )


    return (
        <div className={styles.prototypeWrapper} ref={ref} id={registryID + '-board-wrapper'}>

            <Structure
                hook={hook}
                openTab={open}
                engine={engine}
                selectedVariable={selectedVariable} setSelectedVariable={setSelectedVariable}
                selected={hook.selected[0]}
                focusNode={(n) => {
                    let f = document.getElementById(n)?.parentNode

                    if (f) {
                        const transformation = f
                            .getAttribute('transform')
                            .replace('translate(', '')
                            .replace(')', '')
                            .split(' ')

                        wrapperRef.current.lastChild.scrollLeft = parseFloat(transformation[0]) - wrapperRef.current.lastChild.offsetWidth / 2 + 150
                        wrapperRef.current.lastChild.scrollTop = parseFloat(transformation[1]) - wrapperRef.current.lastChild.offsetHeight / 2
                        hook.setSelected([n])

                    }
                }}
            />
            <ResizableBar type={"width"}/>
            <MinimalTabs

                tabs={['Viewport', 'Event graph']}
                reference={wrapperRef}
                className={styles.prototypeWrapperBoard}
                open={open}
                setOpen={setOpen}
                onTabSwitch={i => {
                    if (i === 0)
                        engine.setInitialized(true)
                    else
                        engine.setInitialized(false)
                }}
            >
                <div style={{
                    display: open === 0 ? undefined : 'none',
                    height: '100%',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <ViewportOptions engine={engine} id={registryID} minimal={true}/>
                    <Viewport
                        allowDrop={true}
                        id={registryID}
                        showPosition={false}
                        handleDrop={event => handleDrop(event, hook.quickAccess.fileSystem, engine, setAlert, load, false, true)}
                        engine={engine}
                    />
                </div>

                <Board
                    id={registryID}
                    hide={open === 0}
                    allNodes={availableNodes}
                    setAlert={setAlert}
                    parentRef={ref}
                    onEmptyClick={() => setSelectedVariable(undefined)}
                    onDrop={(ev) => {
                        const dt = ev.dataTransfer.getData('text')
                        const entity = engine.entities.find(e => e.id === dt)

                        if (entity)
                            return [true, new EntityReference(dt, entity?.name, Object.keys(entity.components))]
                        else
                            return [true]
                    }}
                    hook={hook}
                    selected={hook.selected}
                    setSelected={hook.setSelected}
                    scale={scale}
                    setScale={setScale}
                />


            </MinimalTabs>
            <ResizableBar type={'width'}/>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                width: '275px',
                gap: '3px',
                overflow: 'hidden'
            }}>
                {open === 0 ?
                    <div className={sceneStyles.wrapperContent}>
                        {currentForm.open ? (
                            <div className={sceneStyles.header}>
                                <label>{currentForm.name}</label>
                                <Button
                                    styles={{height: '20px', width: '20px'}}
                                    onClick={() => engine.setLockedEntity(engine.lockedEntity === currentForm.selected?.id ? undefined : currentForm.selected.id)}
                                    className={styles.button}
                                    highlight={engine.lockedEntity === currentForm.selected?.id}
                                    variant={"outlined"}>
                                    <span className={'material-icons-round'} style={{fontSize: '1rem'}}>push_pin</span>
                                </Button>
                            </div>
                        ) : null}

                        <div className={sceneStyles.content}>
                            {currentForm.open ?
                                <FormTabs
                                    addComponent={() => {
                                        // currentForm.selected.components[COMPONENTS.SCRIPT] = new ScriptComponent()
                                        // engine.dispatchEntities({
                                        //     type: ENTITY_ACTIONS.ADD_COMPONENT,
                                        //     payload: {
                                        //         entityID: engine.selected[0],
                                        //         data: currentForm.selected.components[COMPONENTS.SCRIPT],
                                        //         key: COMPONENTS.SCRIPT
                                        //     }
                                        // })
                                    }}
                                    entity={currentForm.selected}
                                    currentTab={currentTab}
                                    setCurrentTab={setCurrentTab}
                                />
                                :
                                null
                            }
                            {currentForm.content}
                        </div>
                    </div>
                    :
                    <>
                        <NodeEditor
                            hook={hook}
                            selected={hook.selected}
                            selectedVariable={selectedVariable}
                        />

                        <Available allNodes={allNodes}/>
                    </>
                }
            </div>
        </div>
    )
}

BlueprintView.propTypes = {
    submitPackage: PropTypes.func.isRequired
}