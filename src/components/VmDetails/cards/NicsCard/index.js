import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { msg } from '../../../../intl'

import BaseCard from '../../BaseCard'
import { Grid, Row, Col } from '../../GridComponents'

import style from './style.css'

/**
 * List of NICs connected to a VM
 */
const NicsCard = ({ vm, vnicProfiles, onEditChange }) => {
  const nicList = vm.get('nics')
    .sort((a, b) => a.get('name').localeCompare(b.get('name')))
    .map(nic => ({
      id: nic.get('id'),
      name: nic.get('name'),
      plugged: nic.get('plugged'),
      ipv4: nic.get('ipv4').toJS(),
      ipv6: nic.get('ipv6').toJS(),
      vnicProfile: {
        id: nic.getIn(['vnicProfile', 'id']),
        name: vnicProfiles.getIn([nic.getIn(['vnicProfile', 'id']), 'name']),
        network: vnicProfiles.getIn([nic.getIn(['vnicProfile', 'id']), 'network', 'name']),
      },
    }))
    .toJS()

  const ip4Label = 'IPv4'
  const ip6Label = 'IPv6'

  const idPrefix = 'vmdetail-nics'

  return (
    <BaseCard
      icon={{ type: 'pf', name: 'network' }}
      title='Network Interfaces'
      editTooltip={`Edit NICs for ${vm.get('id')}`}
      editable={false}
      idPrefix={idPrefix}
      itemCount={vm.get('nics').size}
      onStartEdit={() => { onEditChange(true) }}
      onCancel={() => { onEditChange(false) }}
      onSave={() => { onEditChange(false) }}
    >
      {({ isEditing }) => <React.Fragment>
        { nicList.length === 0 &&
          <div className={style['no-nics']} id={`${idPrefix}-no-nics`}>{msg.noNics()}</div>
        }
        { nicList.length > 0 &&
        <Grid className={style['nics-container']}>
          {nicList.map(nic =>
            <Row key={nic.id} id={`${idPrefix}-${nic.name}`}>
              <Col style={{ display: 'block' }}>
                <div>
                  <span id={`${idPrefix}-${nic.name}-name`}>{nic.name}</span>
                  <span className={style['vnic-info']} id={`${idPrefix}-${nic.name}-vnic-info`}>({nic.vnicProfile.name}/{nic.vnicProfile.network})</span>
                </div>
                <Grid>
                  <Row>
                    <Col cols={6} className={style['ip4-container']} id={`${idPrefix}-${nic.name}-ipv4`}>
                      { nic.ipv4.length > 0 &&
                        <div>
                          {nic.ipv4.map(ip4 => <div key={`${nic.id}-${ip4}`}>{ip4Label}: {ip4}</div>)}
                        </div>
                      }
                    </Col>
                    <Col cols={6} className={style['ip6-container']} id={`${idPrefix}-${nic.name}-ipv6`}>
                      { nic.ipv6.length > 0 &&
                        <div>
                          {nic.ipv6.map(ip6 => <div key={`${nic.id}-${ip6}`}>{ip6Label}: {ip6}</div>)}
                        </div>
                      }
                    </Col>
                  </Row>
                </Grid>
              </Col>
            </Row>
          )}
        </Grid>
        }
      </React.Fragment>}
    </BaseCard>
  )
}
NicsCard.propTypes = {
  vm: PropTypes.object.isRequired,
  vnicProfiles: PropTypes.object.isRequired,
  onEditChange: PropTypes.func.isRequired,
}

export default connect(
  (state) => ({
    vnicProfiles: state.vnicProfiles,
  })
)(NicsCard)
