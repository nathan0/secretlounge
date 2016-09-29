import dude from 'debug-dude'
const { /*debug, log,*/ info /*, warn, error*/ } = dude('bot:commands:mod')

import { sendToAll, sendToUser, sendToMods } from '../../index'
import {
  cursive, htmlMessage,
  modInfoText, getUsername
} from '../../messages'
import { getFromCache, getCacheGroup, setWarnedFlag, hasWarnedFlag } from '../../cache'
import {
  getUserByUsername, getUser, getUsers,
  addWarning
} from '../../db'
import { handedCooldown, ALREADY_WARNED, MESSAGE_DISAPPEARED } from '../../messages'
import { RANKS } from '../../ranks'
import { formatTime } from '../../time'

const getReason = (evt) =>
  evt.args.length > 0
  ? ' (' + evt.args.join(' ') + ')'
  : ''

const ERR_NO_REPLY = 'please reply to a message to use this command'

export default function modCommands (user, evt, reply) {
  const messageRepliedTo = getFromCache(evt, reply)
  const msgId = evt && evt.raw && evt.raw.reply_to_message && evt.raw.reply_to_message.message_id

  switch (evt.cmd) {
    case 'modsay':
      if (evt.args.length <= 0) return reply(cursive('please specify a message, e.g. /modsay message'))
      info('%o sent mod message -> %s', user, evt.args.join(' '))
      sendToAll(htmlMessage(evt.args.join(' ') + ' <b>~mods</b>'))
      break

    case 'info':
      if (evt && evt.raw && evt.raw.reply_to_message) {
        if (messageRepliedTo) {
          const user = getUser(messageRepliedTo.sender)
          reply(htmlMessage(
            modInfoText(user)
          ))
        }
      }
      break

    case 'delete':
      let replyCache = getCacheGroup(msgId)

      if (messageRepliedTo) {
        if (!hasWarnedFlag(msgId)) {
          const cooldownTime = addWarning(messageRepliedTo.sender)
          setWarnedFlag(msgId)
          getUsers().map((user) => {
            if (messageRepliedTo.sender !== user.id) {
              reply({
                ...cursive(MESSAGE_DISAPPEARED),
                type: 'editMessageText',
                chat: user.id,
                id: replyCache && replyCache[user.id],
                options: {
                  parse_mode: 'HTML'
                }
              })
            }
          });
          sendToUser(messageRepliedTo.sender, {
            ...cursive(handedCooldown(cooldownTime, true)),
            options: {
              reply_to_message_id: msgId,
              parse_mode: 'HTML'
            }
          })
        } else {
          reply(cursive(ALREADY_WARNED))
        }
      } else {
        reply(cursive(ERR_NO_REPLY))
      }
      break

    case 'warn':
      if (messageRepliedTo) {
        if (!hasWarnedFlag(msgId)) {
          const cooldownTime = addWarning(messageRepliedTo.sender)
          setWarnedFlag(msgId)
          sendToUser(messageRepliedTo.sender, {
            ...cursive(handedCooldown(cooldownTime)),
            options: {
              reply_to_message_id: msgId,
              parse_mode: 'HTML'
            }
          })
        } else {
          reply(cursive(ALREADY_WARNED))
        }
      } else {
        reply(cursive(ERR_NO_REPLY))
      }
      break
  }
}
