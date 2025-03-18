import { templateDataType, containersType, locationChildSchemaType, usedComponent } from '@/types'
import React from 'react'
import { getChildrenUsedComponents } from '@/utility/utility'

export default function EditContainersData({ location, seenUsedComponents }: { data: containersType, seenUsedComponent: usedComponent, location: locationChildSchemaType, seenUsedComponents: usedComponent[], handlePropsChange: (newPropsObj: templateDataType, sentUsedComponent: usedComponent) => void }) {
    const seenChildren: usedComponent[] = getChildrenUsedComponents(location.parentId, seenUsedComponents)

    return (
        <div>
            <h3>Edit container</h3>

            <div style={{ padding: "1rem" }}>
                {seenChildren.map(eachUsedComponentChild => {
                    return (
                        <div key={eachUsedComponentChild.id}>{eachUsedComponentChild.id}</div>
                    )
                })}
            </div>
        </div>
    )
}
