import { createIsoList, createTemplateList } from '_/components/utils'
import timezones from '_/components/utils/timezones.json'
import { isWindows } from '_/helpers'

const handleClusterIdChange = (clusterId, { blankTemplateId, defaultValues, clusters, templates, operatingSystems, storageDomains, defaultGeneralTimezone, defaultWindowsTimezone }) => {
  let changes = {}
  const templateList = clusterId ? createTemplateList(templates, clusterId) : []
  changes.dataCenterId = clusterId ? clusters.getIn([clusterId, 'dataCenterId']) : undefined
  changes.clusterId = clusterId

  if (clusterId === undefined) {
    changes = { ...changes, ...handleProvisionSourceChange('template', { defaultValues, defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems }) }
    return changes
  }

  if (templateList.length > 1) {
    // cluster includes more than one non blank template
    changes = {
      ...changes,
      ...handleProvisionSourceChange('template', { defaultValues, defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems }),
    }
    if (templateList.length === 2) {
      // cluster includes only one non blank template
      const selectedTemplate = templateList.find(t => t.id !== blankTemplateId)
      changes = {
        ...changes,
        ...(selectedTemplate ? handleTemplateIdChange(selectedTemplate.id, defaultValues.optimizedFor, { templates, operatingSystems, defaultGeneralTimezone, defaultWindowsTimezone }) : {}),
      }
    }
    return changes
  }
  if (templateList.length === 1 && templateList[0].id === blankTemplateId) {
    // cluster includes only one template (Blank)
    const isoList = createIsoList(storageDomains, changes.dataCenterId)

    if (isoList.length > 0) {
      // cluster includes at least one iso cd
      changes = {
        ...changes,
        ...handleProvisionSourceChange('iso', { defaultValues, defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems }),
      }
      if (isoList.length === 1) {
        // cluster includes only one iso cd
        changes.isoImage = isoList[0].file.id
      }
    } else {
      // cluster does not include any non blank template or iso cd
      changes = {
        ...changes,
        ...handleProvisionSourceChange('template', { defaultValues, defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems }),
        ...handleTemplateIdChange(blankTemplateId, defaultValues.optimizedFor, { templates, operatingSystems, defaultGeneralTimezone, defaultWindowsTimezone }),
      }
    }
    return changes
  }
  // fallback should never hit
  changes.isoImage = undefined
  changes.provisionSource = 'template'
  changes.isoImage = undefined
  changes.templateId = blankTemplateId
  return changes
}

const handleProvisionSourceChange = (provisionSource, { defaultValues, defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems }) => {
  const changes = {}
  changes.provisionSource = provisionSource
  changes.isoImage = undefined
  changes.templateId = undefined
  changes.operatingSystemId = defaultValues.operatingSystemId
  changes.memory = defaultValues.memory
  changes.cpus = defaultValues.cpus
  changes.topology = defaultValues.topology
  changes.optimizedFor = defaultValues.optimizedFor
  changes.cloudInitEnabled = defaultValues.initEnabled

  // when changing Provision type to ISO, set the default time zone according to the OS
  if (changes.provisionSource === 'iso') {
    changes.timeZone = checkTimeZone(changes.operatingSystemId, changes.templateId, { defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems })
    changes.initTimezone = '' // reset the sysprep timezone value, we don't support cloud-init TZ yet
  }
  return changes
}

const handleTemplateIdChange = (templateId, defaultOptimizedFor, { templates, operatingSystems, defaultGeneralTimezone, defaultWindowsTimezone }) => {
  const changes = {}
  const template = templates.find(t => t.get('id') === templateId)
  changes.templateId = template.get('id')

  changes.memory = template.get('memory') / (1024 ** 2) // stored in bytes, input in Mib
  changes.cpus = template.getIn([ 'cpu', 'vCPUs' ])
  changes.topology = template.getIn([ 'cpu', 'topology' ]).toJS()
  changes.optimizedFor = template.get('type', defaultOptimizedFor)
  changes.operatingSystemId = operatingSystems
    .find(os => os.get('name') === template.getIn([ 'os', 'type' ]))
    .get('id')

  // Check template's timezone compatibility with the template's OS, set the timezone corresponding to the template's OS
  changes.timeZone = checkTimeZone(changes.operatingSystemId, changes.templateId, { defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems })
  changes.cloudInitEnabled = template.getIn(['cloudInit', 'enabled'])
  changes.initHostname = template.getIn(['cloudInit', 'hostName'])
  changes.initSshKeys = template.getIn(['cloudInit', 'sshAuthorizedKeys'])
  changes.initTimezone = template.getIn(['cloudInit', 'timezone'])
  changes.initCustomScript = template.getIn(['cloudInit', 'customScript'])
  if (changes.initTimezone && isOsWindows(changes.operatingSystemId, operatingSystems)) {
    // Configure Timezone checkbox should be checked if template's timezone set
    changes.enableInitTimezone = true
    changes.lastInitTimezone = changes.initTimezone // select template's timezone in the Timezone drop down
  } else {
    changes.enableInitTimezone = false
    changes.initTimezone = ''
    // select the same default GMT sysprep timezone as in Admin Portal
    changes.lastInitTimezone = timezones.find(timezone => timezone.value.startsWith('(GMT) Greenwich')).id
  }
  return changes
}

const checkTimeZone = (osId, templateId, { defaultGeneralTimezone, defaultWindowsTimezone, templates, operatingSystems }) => {
  const template = templateId ? templates.get(templateId) : undefined
  let timeZone = {
    name: defaultGeneralTimezone,
  }
  const osType = operatingSystems.getIn([ osId, 'name' ])

  if (template && template.getIn(['timeZone', 'name'])) {
    timeZone = template.get('timeZone').toJS()
  }

  const isWindowsTimeZone = timeZone && timezones.find(timezone => timezone.id === timeZone.name)
  const isWindowsVm = isWindows(osType)

  if (isWindowsVm && !isWindowsTimeZone) {
    timeZone = {
      name: defaultWindowsTimezone,
    }
  }
  if (!isWindowsVm && isWindowsTimeZone) {
    timeZone = {
      name: defaultGeneralTimezone,
    }
  }
  return timeZone
}

const isOsWindows = (operatingSystemId, operatingSystems) => {
  const os = operatingSystems.get(operatingSystemId)
  return os && os.get('isWindows')
}

const isOsLinux = (operatingSystemId, operatingSystems) => {
  const os = operatingSystems.get(operatingSystemId)
  return os && !os.get('isWindows')
}

module.exports = {
  handleClusterIdChange,
  handleProvisionSourceChange,
  handleTemplateIdChange,
  checkTimeZone,
  isOsWindows,
  isOsLinux,
}
