import { templateDataType, usedComponent, usedComponentLocationType } from '@/types'
import React from 'react'
import EditNavbarsData from './navbars/EditNavbarsData'
import EditContainersData from './containers/EditContainersData'

export default function TemplateDataSwitch({ location, activeUsedComponent, seenUsedComponents, handlePropsChange }: { location: usedComponentLocationType, seenUsedComponents: usedComponent[], activeUsedComponent: usedComponent, handlePropsChange: (newPropsObj: templateDataType, seenComponentInPage: usedComponent) => void }) {
    if (activeUsedComponent.data === null) return null

    return (
        <>
            {activeUsedComponent.data.category === "navbars" && (
                <EditNavbarsData data={activeUsedComponent.data} activeUsedComponent={activeUsedComponent} handlePropsChange={handlePropsChange} />
            )}

            {activeUsedComponent.data.category === "containers" && location.type === "child" && (
                <EditContainersData location={location} seenUsedComponents={seenUsedComponents} data={activeUsedComponent.data} seenUsedComponent={activeUsedComponent} handlePropsChange={handlePropsChange} />
            )}
        </>
    )
}
